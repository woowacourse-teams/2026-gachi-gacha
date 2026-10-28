# Android 쇼핑 커넥트 카탈로그

Android는 별도 런타임 API 없이 웹과 같은 Google Sheet 원본을 배포 전에 읽어 정적
TypeScript 카탈로그를 생성한다. Sheet 내용이 같으면 웹과 Android의 상품 ID, 정렬,
카테고리, placement와 `revision`도 같다.

## 원본과 검증

저장소 Actions variable `AFFILIATE_CATALOG_SHEET_CSV_URL`은 웹에서 사용하는 공개
`products` 탭 CSV URL과 같다. 시트 헤더와 입력 규칙은 웹 운영 가이드를 따른다.

- `상품제목`, `썸네일URL`, `네이버링크`, `카테고리`, `노출페이지`,
  `노출시작일`, `노출종료일`, `노출여부` 헤더를 정확히 사용한다.
- 제휴 링크는 HTTPS `naver.me`만 허용한다.
- 카테고리는 운영 API의 정확한 한글명 한 개와 일치해야 한다.
- 날짜는 `YYYY-MM-DD`이며 앱은 Asia/Seoul 날짜로 활성 여부를 판정한다.
- 빈 노출페이지는 `/search`, `/map`, `/trade`에 모두 노출한다.

## 로컬 생성

```bash
cd android
npm run catalog:test
AFFILIATE_CATALOG_SHEET_CSV_URL='게시된 CSV URL' npm run catalog:sync
npm run typecheck
```

생성 파일은 `src/domains/affiliate/generatedCatalog.ts`다. 같은 Sheet로 웹과 Android를
각각 생성했을 때 파일 안의 `revision`이 같은지 확인한다. 공개 상품 정보 외의 값은
시트나 생성 파일에 넣지 않는다.

## CI 동기화

`Android Quality`가 `android` 브랜치 push 또는 수동 실행을 성공한 뒤 같은 Sheet를
다시 검증한다. 산출물이 바뀌면 자동화 브랜치와 `android` 대상 PR을 만들고, 같으면
PR을 만들지 않는다. 따라서 카탈로그 변경 배포 시에는 웹 동기화 workflow와 Android
Quality를 각각 실행하고 두 정적 산출물의 revision을 확인한다.

GitHub Actions의 PR 생성이 저장소 정책으로 막혀 있으면 Actions 설정에서 workflow의
pull request 생성 권한을 허용해야 한다. workflow는 PR을 자동 승인하거나 병합하지
않는다.

## 앱 노출

- 검색: 선택 카테고리 또는 검색 결과 카테고리와 `/search`가 일치할 때 목록 아래 노출
- 지도: 선택 가챠의 카테고리 또는 제목과 `/map`이 일치할 때 요약 카드에서 모달 진입
- 교환 상세: 글 카테고리 또는 제목과 `/trade`가 일치할 때 댓글 아래 노출

모든 화면은 경제적 이해관계 문구를 표시하며 링크를 시스템 브라우저로 연다. 이미지
실패는 앱 탐색을 막지 않고 G 로고 fallback으로 처리한다.
