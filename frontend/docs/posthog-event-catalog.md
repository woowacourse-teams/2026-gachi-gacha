# PostHog 제품 분석 운영 가이드

## 목적

가치가챠의 핵심 가치인 **가챠·매장 탐색**, **교환글 공급**, **교환 상대와의 연결**이 실제 행동으로 이어지는지 확인한다.
DOM 클릭 수만 세지 않고, 사용자의 의도와 처리 결과를 함께 담은 명시적 제품 이벤트를 퍼널·리텐션·기능 건강도 분석에 사용한다.

## 수집 원칙

- 로그인 사용자는 JWT의 `memberId`를 `member:{memberId}` 형식의 안정적인 distinct id로 식별한다.
- 이름, 닉네임, 이메일, 검색어 원문, 장소명·주소, 교환글 원문, 채팅 본문은 이벤트에 넣지 않는다.
- 검색어와 메시지는 원문 대신 길이만 수집한다.
- 모든 명시적 이벤트에 `analytics_schema_version`, `app_version`, `environment`, `is_internal_user` 문맥을 붙인다.
- 로그인 전 익명 행동은 로그인 후 `identify`로 같은 사용자 여정에 연결하고, 로그아웃 시 `reset`한다.
- 자동 수집은 링크·버튼·폼의 `click`, `submit`만 허용하고 화면 텍스트를 마스킹한다.
- `[data-private]` 영역은 자동 수집에서 제외하며, 세션 리플레이는 모든 입력값을 마스킹하고 `[data-private-media]`를 가린다.
- OAuth URL의 `code`, `state`, 토큰류 파라미터는 전송 직전에 제거한다.
- 분석 도구 로딩·전송 실패는 서비스 기능을 막지 않는다.
- 이벤트 이름이나 속성 의미는 수집 시작 후 덮어 바꾸지 않는다. 의미가 달라지면 새 이벤트 또는 `analytics_schema_version`을 사용한다.

## 내부·테스트 사용자 제외

1. 팀원 브라우저에서 서비스 주소에 `?analytics_internal=true`를 한 번 붙여 접속한다.
2. 해당 브라우저에는 내부 사용자 표시가 저장되고 이후 PostHog 초기화와 이벤트 전송 자체를 중단한다.
3. 다시 수집 대상 브라우저로 전환할 때는 `?analytics_internal=false`로 접속한다.
4. 이미 수집된 테스트 데이터나 다른 테스트 계정은 PostHog에서 별도 코호트로 관리하고 모든 운영 인사이트에 제외 필터를 적용한다.
5. 운영 대시보드는 `environment = production` 필터를 기본으로 고정한다.

브라우저 표시와 PostHog 필터를 함께 쓰는 이유는 신규 팀원·새 기기·이미 수집된 데이터를 한 방식만으로 완전히 제외하기 어렵기 때문이다.

## 공통·인증 이벤트

| 이벤트                     | 발생 시점                          | 주요 속성                                   |
| -------------------------- | ---------------------------------- | ------------------------------------------- |
| `navigation_selected`      | 헤더·독립 화면의 주요 이동 선택    | `destination`, `source`, `is_authenticated` |
| `auth_required_redirected` | 보호 기능에서 로그인 화면으로 이동 | `target_pathname`                           |
| `oauth_login_started`      | 카카오·네이버 로그인 선택          | `provider`, `return_pathname`               |
| `oauth_login_completed`    | OAuth 콜백 처리 완료               | `provider`, `outcome`                       |
| `recovery_action_selected` | 오류 상태에서 다시 시도            | `feature`                                   |

## 가챠 검색·지도·매장 이벤트

| 이벤트                         | 발생 시점                 | 주요 속성                                                    |
| ------------------------------ | ------------------------- | ------------------------------------------------------------ |
| `category_selected`            | 카테고리 탭 선택          | `category_name`                                              |
| `category_gacha_selected`      | 카테고리 가챠 선택        | `category_name`, `gacha_id`, `result_position`               |
| `category_feed_more_requested` | 다음 카테고리 페이지 요청 | `category_name`, `loaded_item_count`                         |
| `gacha_search_submitted`       | 가챠 검색 제출            | `query_length`                                               |
| `gacha_search_results_viewed`  | 검색 결과 수신            | `query_length`, `result_count`                               |
| `gacha_search_failed`          | 가챠 검색 실패            | `query_length`                                               |
| `gacha_selected`               | 검색 결과의 가챠 선택     | `gacha_id`, `result_position`, `source`                      |
| `store_results_loaded`         | 지도 매장 조회 성공       | `gacha_id`, `store_count`, `trigger`, `search_radius_meters` |
| `store_discovery_succeeded`    | 매장이 한 곳 이상 조회됨  | `gacha_id`, `store_count`, `trigger`, `search_radius_meters` |
| `store_results_failed`         | 지도 매장 조회 실패       | `gacha_id`, `trigger`, `search_radius_meters`                |
| `store_selected`               | 목록·마커에서 매장 선택   | `gacha_id`, `store_id`, `source`                             |
| `store_opened`                 | 매장 상세 진입            | `gacha_id`, `store_id`, `source`                             |
| `map_area_researched`          | 현재 지도 영역 재검색     | `gacha_id`, `search_radius_meters`                           |
| `store_detail_load_completed`  | 매장 상세 조회 완료       | `store_id`, `outcome`                                        |
| `store_photo_viewed`           | 매장 사진 뷰어 열기       | `store_id`, `photo_index`, `photo_count`                     |
| `store_catalog_load_completed` | 매장 보유 가챠 조회 완료  | `store_id`, `outcome`, `item_count`                          |
| `store_catalog_more_requested` | 매장 보유 가챠 더 보기    | `store_id`, `loaded_item_count`                              |

`gacha_id = null`이면 특정 가챠를 고르지 않은 홍대 전체 매장 탐색이다.

## 거래·교환 이벤트

| 이벤트                            | 발생 시점                  | 주요 속성                                                                     |
| --------------------------------- | -------------------------- | ----------------------------------------------------------------------------- |
| `trade_list_load_completed`       | 거래 목록 조회 완료        | `query_applied`, `outcome`, `result_count`, `total_count`                     |
| `trade_search_submitted`          | 거래 검색 제출             | `query_length`                                                                |
| `trade_selected`                  | 거래 카드 선택             | `trade_id`, `status`, `source`                                                |
| `trade_create_started`            | 글 등록 진입               | `source`                                                                      |
| `trade_edit_started`              | 글 수정 진입               | `trade_id`, `source`                                                          |
| `trade_delete_started`            | 글 삭제 확인창 열기        | `trade_id`, `source`                                                          |
| `trade_list_more_requested`       | 다음 거래 목록 요청        | `query_applied`, `loaded_item_count`, `source`                                |
| `trade_form_submitted`            | 유효한 등록·수정 폼 제출   | `mode`, 이미지·카테고리 수, 선택 필드 존재 여부                               |
| `trade_form_completed`            | 등록·수정 API 완료         | `mode`, `trade_id`, `outcome`                                                 |
| `trade_category_toggled`          | 작성 폼 카테고리 선택·해제 | `mode`, `category_id`, `action`                                               |
| `trade_photo_selection_completed` | 사진 선택 검증 완료        | 허용·거절·전체 파일 수                                                        |
| `place_search_opened`             | 장소 검색창 열기           | `place_context`, `trade_form_mode`                                            |
| `place_search_completed`          | 장소 검색 완료             | `place_context`, `trade_form_mode`, `outcome`, `result_count`, `query_length` |
| `place_search_result_selected`    | 장소 검색 결과 선택        | `place_context`, `trade_form_mode`, `result_position`                         |
| `place_selection_cleared`         | 선택한 장소 해제           | `place_context`, `trade_form_mode`                                            |
| `trade_status_update_completed`   | 거래 상태 변경 완료        | 이전·다음 상태, `outcome`                                                     |
| `trade_delete_completed`          | 글 삭제 완료               | `trade_id`, `outcome`                                                         |
| `trade_chat_started`              | 거래 상세에서 채팅 선택    | `trade_id`, `is_authenticated`                                                |

`place_context`는 `trade_purchase_store`, `trade_exchange_place`, `profile_preferred_area` 중 하나다. 프로필 흐름에는 `trade_form_mode = null`을 사용한다.

## 채팅·계정 이벤트

| 이벤트                        | 발생 시점                        | 주요 속성                                                |
| ----------------------------- | -------------------------------- | -------------------------------------------------------- |
| `chat_room_entry_completed`   | 거래 기반 채팅방 조회·생성 완료  | `trade_id`, `room_id`, `room_was_created`, `outcome`     |
| `chat_room_selected`          | 채팅 목록에서 방 선택            | `room_id`, `source`                                      |
| `chat_message_send_completed` | 텍스트 메시지 전송 완료          | `room_id`, `outcome`, `message_length`                   |
| `chat_history_load_completed` | 이전 메시지 조회 완료            | `room_id`, `outcome`                                     |
| `profile_edit_started`        | 프로필 수정창 열기               | 없음                                                     |
| `profile_update_completed`    | 프로필 저장 완료                 | `outcome`, `has_trade_location`, `trade_location_change` |
| `account_menu_selected`       | 방침·고객센터·로그아웃·탈퇴 선택 | `target`, `source`                                       |
| `account_deletion_completed`  | 회원 탈퇴 요청 완료              | `outcome`                                                |

`trade_location_change`는 `unchanged`, `set`, `changed`, `cleared` 중 하나다. 위치명과 주소 자체는 전송하지 않는다.

## 핵심 지표와 해석

### 1. 주간 활성 사용자(WAU)

다음 중 하나 이상을 수행한 주간 고유 사용자 수를 본다.

- `store_discovery_succeeded`
- `trade_form_completed` 중 `mode = create`, `outcome = success`
- `chat_message_send_completed` 중 `outcome = success`

로그인이나 페이지 방문만으로 활성 사용자로 세지 않아, 탐색 또는 교환 가치를 실제로 경험한 사용자 규모를 볼 수 있다.

### 2. 주간 신규 채팅방 수

`chat_room_entry_completed` 중 `outcome = success`, `room_was_created = true`의 주간 건수를 본다.

공급자인 게시글 작성자와 관심 사용자가 만난 시점을 나타내므로 교환 서비스의 핵심 연결 지표다. 중복·누락 없는 사업 지표의 기준값은 백엔드 집계로 두고, PostHog에서는 유입 경로와 이탈 지점을 함께 분석한다.

### 3. 탐색 성공률

`store_results_loaded` 대비 `store_discovery_succeeded` 비율과 `store_count = 0` 비율을 함께 본다.

- 성공률 하락: 가챠 데이터와 매장 보유 정보가 부족하거나 검색 반경이 부적절할 가능성
- 조회 실패 증가: API·지도 연동의 기능 문제 가능성
- 검색 결과는 많지만 상세 진입이 적음: 결과 카드의 정보나 매장 선택 경험 개선 필요

### 4. 교환글 등록 성공률

`trade_form_submitted` 대비 성공한 `trade_form_completed` 비율을 `mode`별로 본다.

사진 제한, 유효성 검사, API 오류 등으로 제출 후 완료되지 않는 구간을 찾을 수 있다. `trade_photo_selection_completed`의 `rejected_count`를 함께 보면 파일 검증이 이탈 원인인지 확인할 수 있다.

### 5. 장소 검색 채택률

`place_search_opened` → 성공한 `place_search_completed` → `place_search_result_selected` 퍼널을 `place_context`별로 본다.

거래글의 구매 매장·교환 장소와 v1.2.0의 선호 거래 지역 기능을 같은 계약으로 비교할 수 있다. 프로필은 성공한 `profile_update_completed`와 `trade_location_change`까지 연결해 실제 저장 여부를 확인한다.

## PostHog 대시보드 구성안

### A. 제품 건강도

| 카드                    | 설정                                                    | 얻는 정보                               |
| ----------------------- | ------------------------------------------------------- | --------------------------------------- |
| 핵심 행동 WAU           | 위 3개 활성 이벤트의 주간 고유 사용자                   | 실제 가치를 사용한 사용자 규모          |
| 주간 교환글 생성        | 성공한 create `trade_form_completed` 건수               | 교환 시장의 공급량                      |
| 주간 신규 채팅방        | 성공 + `room_was_created = true`                        | 게시글과 관심 사용자의 연결량           |
| 성공 메시지 전송 사용자 | 성공한 `chat_message_send_completed` 고유 사용자        | 채팅방 생성 후 실제 대화 여부           |
| 탐색 성공률             | `store_results_loaded` 대비 `store_discovery_succeeded` | 가챠 탐색이 매장 발견으로 이어지는 정도 |

모든 카드는 `environment = production`, 내부·테스트 사용자 제외 필터를 저장한다.

### B. 가챠 탐색 퍼널

1. `gacha_search_submitted`
2. `gacha_selected`
3. `store_discovery_succeeded`
4. `store_opened`

카테고리 진입은 `category_selected` → `category_gacha_selected` → `store_discovery_succeeded` → `store_opened`로 별도 퍼널을 만든다. 두 퍼널의 전환율을 비교하면 텍스트 검색과 카테고리 탐색 중 어느 진입 경험이 매장 방문 의도에 더 잘 연결되는지 알 수 있다.

### C. 교환 공급 퍼널

1. `trade_create_started`
2. `trade_form_submitted`
3. `trade_form_completed` (`mode = create`, `outcome = success`)

완료 실패 이벤트를 `outcome`으로 분해하고 사진 거절률을 옆에 배치한다.

### D. 매칭 퍼널

1. `trade_selected`
2. `trade_chat_started`
3. `chat_room_entry_completed` (`outcome = success`)
4. `chat_message_send_completed` (`outcome = success`)

`trade_chat_started.is_authenticated`로 분해하면 로그인 요구가 이탈에 미치는 영향을 볼 수 있다. `room_was_created`로 신규 연결과 기존 대화 재진입을 구분한다.

### E. 프로필 선호 지역 퍼널

1. `place_search_opened` (`place_context = profile_preferred_area`)
2. `place_search_completed` (`outcome = success`)
3. `place_search_result_selected`
4. `profile_update_completed` (`outcome = success`, `trade_location_change = set 또는 changed`)

검색만 하고 저장하지 않는 이탈과, 기존 값을 해제하는 행동을 구분할 수 있다.

### F. 기능 안정성

- `*_completed`의 `outcome = failure` 추이
- `gacha_search_failed`, `store_results_failed`
- `recovery_action_selected`의 기능별 건수
- 배포 후 `app_version`별 실패율 비교

실패율 급증 시 해당 기간의 세션 리플레이를 확인하되, 입력값과 비공개 영역은 마스킹된 상태로만 사용한다.

## 리텐션 구성

서비스 사용 주기를 고려해 주간 리텐션을 사용한다.

- 시작 행동: 위 WAU 정의의 핵심 행동 중 하나
- 복귀 행동: 다음 주에도 핵심 행동 중 하나
- 비교: 첫 행동이 탐색인 사용자와 교환인 사용자를 코호트로 나눠 W+1, W+2를 비교

페이지 방문 리텐션과 달리 실제 가치 행동의 반복 여부를 보여준다. 신규 기능 배포 전후 비교에는 `app_version` 또는 최초 행동 날짜 코호트를 사용한다.

## 운영 체크리스트

- [ ] GitHub `development`, `production` Environment에 `POSTHOG_ENABLED`, `POSTHOG_API_KEY`, `POSTHOG_API_HOST` 설정
- [ ] 운영 대시보드에 `environment = production` 기본 필터 적용
- [ ] 팀원·테스트 계정 제외 코호트와 프로젝트 필터 생성
- [ ] 핵심 퍼널 4종과 주간 리텐션 인사이트 생성
- [ ] 배포 후 Live Events에서 공통 문맥과 이벤트 속성 검증
- [ ] OAuth callback의 `$current_url`에 `code`, `state`가 남지 않는지 검증
- [ ] 세션 리플레이에서 입력값·비공개 텍스트·이미지가 마스킹되는지 검증
- [ ] 이벤트 사전 변경 시 코드의 타입 계약과 이 문서를 함께 수정
