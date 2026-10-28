# Android 교환글 작성·수정

## 서버 계약

- 작성: `POST /api/v1/trades`
- 수정: `PUT /api/v1/trades/{tradeId}`
- 상태: `PATCH /api/v1/trades/{tradeId}/status`
- 삭제: `DELETE /api/v1/trades/{tradeId}`

작성과 수정은 multipart이며 `request` 파트는 `application/json`, 사진은 순서대로
반복되는 `images` 파트다. 수정 요청에서 사진 파트를 생략하면 기존 사진을 유지하고,
한 장이라도 보내면 기존 사진 전체를 교체한다. 수정은 PUT이므로 사진 외의 기존 필드는
모두 다시 보낸다.

## 사진 정책

- JPG, PNG, WebP만 선택
- 원본 장당 10MB 이하, 최대 5장
- 가장 긴 변을 800px로 줄이고 WebP로 순차 압축
- 1MB를 넘으면 더 낮은 품질로 한 번 재압축하고, 그래도 넘으면 업로드하지 않음
- 압축 실패 시 원본을 대신 전송하지 않음
- 좌우 이동 버튼으로 정한 순서가 multipart 순서이며 첫 사진이 썸네일

HEIF 등 지원하지 않는 사진은 선택 단계에서 안내한다. 실제 기기에서 JPEG/PNG/WebP,
여러 장, 압축 실패와 메모리 사용량을 검증하기 전 완료로 간주하지 않는다.

## 장소 정책

위치 권한과 GPS는 요청하지 않는다. 사용자가 장소명·주소를 입력하고 Kakao 지도를
움직여 중심 표시를 실제 좌표에 맞춘다. 저장 전 위도 33~39, 경도 124~132 범위를
검사한다. Kakao 지도 설정이나 로딩이 실패하면 장소를 저장하지 않는다.

웹의 Kakao 키워드 장소 검색과 완전히 같은 자동 검색을 Android에 추가하려면 Kakao
Local API를 호출할 서버 계약 또는 Android에 안전하게 공급할 별도 검색 계약이 필요하다.
현재 native app key를 REST key처럼 사용하거나 앱에 새 비밀 키를 하드코딩하지 않는다.

## 남은 실제 계정 QA

- 작성 후 상세 이동과 목록 갱신
- 기존 사진 유지, 새 사진 전체 교체, 사진 순서
- 작성자만 수정·삭제·상태 변경 가능한지 확인
- access token 만료 중 multipart 재시도
- 서버 400 필드 오류와 413 용량 오류 표시
- 키보드, 작은 화면, 큰 글자, background/foreground

production 거래 feature flag는 위 QA와 신고·차단·Play Console 선언 확인 전까지 켜지
않는다.
