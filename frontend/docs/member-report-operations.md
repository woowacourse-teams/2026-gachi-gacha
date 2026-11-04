# 사용자 신고 접수 운영 가이드

## 선택한 임시 수신 경로

신고 전용 Google Sheet에 연결된 Apps Script 웹앱을 사용한다. 별도 서버를
배포하지 않고도 기존 신고 모달에서 제출한 내용을 팀이 한곳에서 확인할 수 있고,
이벤트 응모 기능과 같은 배포 방식을 재사용할 수 있다.

신고에는 회원 식별자와 사용자가 작성한 상세 내용이 포함될 수 있으므로 이벤트
응모 시트와 분리한다. 시트와 Apps Script 편집 권한은 신고를 처리하는 최소 인원만
가진다.

## 프론트 요청 계약

프론트는 `MEMBER_REPORT_ENDPOINT`에 JSON 문자열을
`text/plain;charset=UTF-8` 단순 POST로 보낸다. 주요 필드는 다음과 같다.

```json
{
  "reportId": "7fe8e45c-851a-48cc-94a5-fcd39a9d9978",
  "reporterMemberId": "3",
  "reporterId": "3",
  "targetMemberId": 7,
  "reportedUserId": "7",
  "targetNickname": "쿠로미러버",
  "source": "comment",
  "referenceId": "12",
  "reason": "harassment",
  "reportType": "욕설·괴롭힘",
  "details": "[신고 대상: 쿠로미러버 / 위치: 댓글 #12]\n반복적으로 욕설을 작성했습니다.",
  "pagePath": "/trade/15",
  "submittedAt": "2026-10-20T05:00:00.000Z",
  "appVersion": "1.10.0",
  "environment": "production"
}
```

`source`는 `trade`, `comment`, `chat`, `mypage` 중 하나이고, `reason`은
`spam`, `fraud`, `harassment`, `inappropriate`, `privacy`, `other` 중 하나다.
`reporterId`, `reportedUserId`, `reportType`은 초기 신고 시트의 단순 계약과
호환하기 위한 필드다. 비회원 댓글은 회원 ID가 없으므로 `reportedUserId`를
`ANONYMOUS`로 기록하고, 닉네임과 댓글 참조 ID는 `details`의 문맥 머리말로
보존한다.

신고 대상 콘텐츠 원문과 전체 URL 쿼리는 전송하지 않는다. 운영자는
`source`, `referenceId`, `pagePath`를 이용해 서버 원본을 확인한다.

## 신고 전용 시트와 Apps Script

현재 임시 시트는 다음 5개 열만으로도 접수할 수 있다.

```text
제출일시 | 신고자 ID | 신고 대상자 ID | 신고 유형 | 상세 내용
```

현재 배포된 단순 스크립트는 호환 필드인 `reporterId`, `reportedUserId`,
`reportType`, `details`를 읽는다. 상세 내용은 프론트가 신고 위치를 함께 붙여
보내므로 거래글·댓글·채팅을 구분할 수 있다. 다만 공개된 Apps Script 주소를
직접 호출하면 클라이언트 검증을 우회할 수 있으므로, 아래 확장형 스크립트의
허용 목록·길이 제한·수식 주입 방어와 중복 방지를 적용하는 편이 안전하다.

### 권장 확장형 시트

시트 탭 이름을 `신고`로 만들고 첫 행에 다음 열을 순서대로 추가한다.

```text
접수시각 | reportId | 신고회원Id | 대상회원Id | 대상닉네임 | 화면 | 대상참조Id | 사유 | 상세내용 | 화면경로 | 클라이언트제출시각 | 앱버전 | 환경
```

스프레드시트의 `확장 프로그램 > Apps Script`에 아래 코드를 추가한다.

```javascript
const SHEET_NAME = '신고';
const SOURCES = ['trade', 'comment', 'chat', 'mypage'];
const REASONS = [
  'spam',
  'fraud',
  'harassment',
  'inappropriate',
  'privacy',
  'other',
];

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function isMissing(value) {
  return value === undefined || value === null || value === '';
}

function safeText(value, maxLength) {
  const text = String(value ?? '')
    .trim()
    .slice(0, maxLength);

  // 사용자 입력이 스프레드시트 수식으로 실행되지 않게 한다.
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  let locked = false;

  try {
    const input = JSON.parse(event.postData.contents);
    const required = [
      'reportId',
      'targetNickname',
      'source',
      'reason',
      'submittedAt',
    ];

    if (required.some((key) => isMissing(input[key]))) {
      return json({ ok: false, message: '필수 신고 정보가 없습니다.' });
    }

    if (!SOURCES.includes(input.source) || !REASONS.includes(input.reason)) {
      return json({ ok: false, message: '신고 정보를 확인해 주세요.' });
    }

    if (String(input.details ?? '').length > 500) {
      return json({ ok: false, message: '상세 내용은 500자 이하여야 합니다.' });
    }

    lock.waitLock(10000);
    locked = true;

    const sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    if (!sheet) {
      return json({ ok: false, message: '신고 시트를 찾지 못했습니다.' });
    }

    const reportId = safeText(input.reportId, 80);
    const lastRow = sheet.getLastRow();
    const existingIds =
      lastRow < 2
        ? []
        : sheet
            .getRange(2, 2, lastRow - 1, 1)
            .getDisplayValues()
            .flat();

    if (existingIds.includes(reportId)) {
      return json({ ok: true });
    }

    sheet.appendRow([
      new Date(),
      reportId,
      safeText(input.reporterMemberId, 30),
      isMissing(input.targetMemberId) ? '' : Number(input.targetMemberId),
      safeText(input.targetNickname, 80),
      input.source,
      safeText(input.referenceId, 80),
      input.reason,
      safeText(input.details, 500),
      safeText(input.pagePath, 200),
      safeText(input.submittedAt, 40),
      safeText(input.appVersion, 30),
      safeText(input.environment, 30),
    ]);

    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, message: '신고를 저장하지 못했습니다.' });
  } finally {
    if (locked) {
      lock.releaseLock();
    }
  }
}
```

Apps Script에서 `배포 > 새 배포 > 웹 앱`을 선택하고 `/exec` URL을 발급한다.
프론트 배포 환경에 다음 값을 등록한 뒤 재배포한다.

```dotenv
MEMBER_REPORT_ENDPOINT=https://script.google.com/macros/s/배포_ID/exec
```

엔드포인트가 비어 있으면 신고 폼은 사유를 안내하는 용도로만 열리고 제출 버튼은
비활성화된다. 엔드포인트가 설정된 경우에도 저장소가 `{ "ok": true }`를 반환한
뒤에만 접수 완료 화면을 표시한다.

## 차단 후 신고 흐름

차단 API가 성공하면 대상 회원 ID를 즉시 필터에 반영한다. 동시에 대상 ID,
닉네임, 화면 종류와 참조 ID를 전역 Provider에 보관해 원래 댓글·게시글·채팅이
화면에서 사라져도 다음 안내를 유지한다.

- 차단 완료와 앞으로 보이지 않는 범위를 안내한다.
- `괜찮아요`를 누르면 종료한다.
- `이어서 신고하기`를 누르면 보관한 대상을 신고 폼으로 전달한다.

## 운영상 한계와 전환 기준

Apps Script URL과 브라우저가 보내는 회원 ID는 공개되며 위조될 수 있다. 따라서
이 방식은 심사와 초기 운영을 위한 임시 접수함으로 사용하고, 운영자가 대상
콘텐츠와 신고자를 서버 원본으로 재확인해야 한다. 반복 신고 제한, 증거 보존,
처리 상태, 제재 이력과 감사 로그가 필요해지는 시점에는 인증된 백엔드 신고 API와
관리자 도구로 전환한다.

- 시트 공유자는 신고 담당자로 제한한다.
- 개인정보처리방침에 수집 목적, 항목, 보유 기간과 파기 방법을 반영한다.
- 상세 내용에 연락처 등 개인정보를 적지 말라는 운영 안내를 검토한다.
- 신고 건별 처리 상태와 담당자 열은 운영 시트에서 별도로 관리한다.
