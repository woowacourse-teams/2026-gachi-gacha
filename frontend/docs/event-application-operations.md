# 이벤트 응모 운영 가이드

## 현재 프론트 계약

응모 페이지는 다음 JSON을 `EVENT_APPLICATION_ENDPOINT`에 `POST`합니다.

```json
{
  "eventId": "popular-goods-giveaway-2026",
  "memberId": "37",
  "desiredTrack": "BOTH",
  "instagramId": "gachi__.gacha",
  "tradeId": 153,
  "tradeUrl": "https://gachigacha.kro.kr/trade/153",
  "privacyConsent": true
}
```

`desiredTrack`은 화면의 이벤트 A/B 트랙을 각각 `BASIC`, `COMPLETED`로,
두 트랙 모두 응모는 `BOTH`로 전송합니다. Apps Script의 허용 목록도 이 세
값과 일치해야 합니다. 프론트는
Google Apps Script의 CORS 사전 요청을 피하기 위해 `Content-Type:
text/plain;charset=UTF-8`로 JSON 문자열을 전송합니다.

## 스프레드시트 준비

시트 탭 이름은 `응모`로 지정하고 첫 번째 행에 다음 열을 순서대로 만듭니다.
현재 Apps Script는 헤더 문자열 자체가 아니라 열 순서로 값을 기록하므로 아래
한국어 이름을 그대로 사용할 수 있습니다.

```text
제출시기 | eventId | memberId | 지원트랙 | 인스타Id | 거래Id | 거래글Url | 개인정보사용동의
```

스프레드시트의 `확장 프로그램 > Apps Script`에서 아래 예시를 사용할 수
있습니다. 같은 이벤트와 회원의 재제출은 새 행을 만들지 않고 기존 행을 최신
내용으로 교체합니다.

```javascript
const SHEET_NAME = '응모';

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function doPost(event) {
  const lock = LockService.getScriptLock();

  try {
    const input = JSON.parse(event.postData.contents);
    const required = [
      'eventId',
      'memberId',
      'desiredTrack',
      'instagramId',
      'tradeId',
      'tradeUrl',
      'privacyConsent',
    ];

    if (required.some((key) => input[key] === undefined || input[key] === '')) {
      return json({ ok: false, message: '필수 응모 정보가 없습니다.' });
    }

    if (!['BASIC', 'COMPLETED', 'BOTH'].includes(input.desiredTrack)) {
      return json({ ok: false, message: '희망 트랙이 올바르지 않습니다.' });
    }

    lock.waitLock(10000);

    const sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    if (!sheet) {
      return json({ ok: false, message: '응모 시트를 찾지 못했습니다.' });
    }

    const row = [
      new Date(),
      input.eventId,
      String(input.memberId),
      input.desiredTrack,
      input.instagramId,
      Number(input.tradeId),
      input.tradeUrl,
      input.privacyConsent === true,
    ];
    const values = sheet.getDataRange().getValues();
    const existingIndex = values.findIndex(
      (current, index) =>
        index > 0 &&
        current[1] === input.eventId &&
        String(current[2]) === String(input.memberId),
    );

    if (existingIndex >= 0) {
      sheet.getRange(existingIndex + 1, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, message: '응모 정보를 저장하지 못했습니다.' });
  } finally {
    lock.releaseLock();
  }
}
```

Apps Script에서 `배포 > 새 배포 > 웹 앱`을 선택하고 실행 계정과 접근 범위를
설정한 뒤 `/exec`로 끝나는 웹 앱 URL을 사용합니다. 개발 도메인에서 실제 POST를
한 번 보내 리디렉션과 CORS 동작까지 확인해야 합니다.

기존 웹 앱이 `BASIC`, `COMPLETED`만 허용하고 있다면 위 허용 목록에 `BOTH`를
추가한 뒤 반드시 새 버전으로 다시 배포해야 합니다. 코드를 저장하기만 하면 현재
`/exec` 배포에는 반영되지 않습니다.

## 프론트 배포 환경변수

```dotenv
EVENT_APPLICATION_ENABLED=true
EVENT_APPLICATION_START_AT=2026-10-10T00:00:00+09:00
EVENT_APPLICATION_END_AT=2026-10-17T00:00:00+09:00
EVENT_APPLICATION_ENDPOINT=https://script.google.com/macros/s/AKfycbwELCsvRhWcSHC9ecFZLFLX3xgDVApke_PyhbEj0SqHnETYxVPMC0qJsbv-4bj1Uqc/exec
```

시작·종료 시각, 제출 URL 중 하나라도 없거나 잘못되면 마이페이지 버튼은
노출되지 않고 직접 접근한 페이지에서도 제출 폼을 열지 않습니다.

## 확정된 운영 정책

- 응모 기간은 2026년 10월 10일 00:00부터 10월 16일 23:59:59까지다.
- 당첨자는 2026년 10월 31일 라이브 방송에서 발표한다.
- 같은 이벤트에 같은 회원이 다시 제출하면 마지막 제출 내용으로 덮어쓴다.
- 응모정보는 당첨자 경품 전달 완료 후 삭제한다.
- 이벤트 A 트랙은 회원가입, 공식 Instagram 팔로우, 본인 거래글 1건을
  요구한다.
- 이벤트 B 트랙은 A 트랙 조건을 포함하고 실제 거래 완료 1건을 추가로
  요구한다. 운영진이 당첨 후보의 회원 ID, 거래글 및 채팅 기록을 서버
  데이터와 대조해 실제 거래 대화와 완료 여부를 확인한다.
- 두 트랙 모두를 선택한 응모는 `BOTH`로 저장하며 A 트랙과 B 트랙 추첨 대상에
  각각 한 번씩 포함한다. 동일 회원의 당첨은 최대 1개로 제한한다. B 트랙 당첨자
  2명을 먼저 추첨하고 해당 회원을 제외한 뒤 A 트랙 당첨자 3명을 추첨한다.

## 운영 전 필수 확인

- 개인정보처리방침에 `memberId`, Instagram ID, 거래글 링크, 희망 트랙,
  Google Sheets 사용 목적과 경품 전달 완료 후 파기 기준이 반영되었는지
  확인합니다.
- 스프레드시트 열람 권한은 이벤트 담당자에게만 부여합니다.
- 추첨 전 당첨 후보의 응모 회원·거래글 소유권·B 트랙 자격을 서버 데이터로
  재검증합니다.
- 운영 Apps Script가 `BASIC`, `COMPLETED`, `BOTH`를 모두 허용하도록 새 버전으로
  배포되었는지 확인합니다.

## 보안상 권장 구조

Apps Script URL은 브라우저에 공개되며, 브라우저가 보내는 `memberId`는 위조할 수
있습니다. 따라서 직접 시트 전송 방식은 참가 후보를 모으는 임시 수단으로만
사용하고 모든 당첨 후보를 서버 데이터로 다시 검증해야 합니다.

경품과 중복 응모를 정확히 통제하려면 다음 구조가 권장됩니다.

1. 프론트가 가치가챠 백엔드의 인증 필요 응모 API를 호출합니다.
2. 백엔드는 access token으로 `memberId`를 결정합니다.
3. 백엔드가 거래글 소유권, 완료 상태, 중복 응모를 검증합니다.
4. 검증된 응모를 DB에 저장하고 Google Sheets에는 운영용으로 동기화합니다.

이 구조에서는 프론트 요청 본문에 `memberId`를 포함할 필요가 없습니다.
