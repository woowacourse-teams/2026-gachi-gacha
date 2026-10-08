# PostHog 이벤트 사전

## 목적

PostHog의 자동 페이지뷰와 autocapture를 보조하는 명시적 제품 이벤트를 정의한다.
단순한 DOM 클릭 수가 아니라 사용자가 어떤 기능을 어떤 경로로 사용했고 결과가
어땠는지 분석하는 것을 목표로 한다.

## 수집 원칙

- 로그인 사용자는 JWT의 `memberId`를 `member:{memberId}` 형식의 distinct id로 식별한다.
- 이름, 닉네임, 이메일, 검색어 원문, 교환글 원문, 장소명·주소, 채팅 본문은 이벤트에 넣지 않는다.
- 검색어와 메시지는 원문 대신 길이만 수집한다.
- 팀원은 `?analytics_internal=true`로 내부 사용자 표시를 저장해 수집 대상에서 제외한다.
- 분석 도구 로딩·전송 실패는 서비스 기능을 막지 않는다.
- 페이지뷰와 일반 클릭은 PostHog autocapture로 확인하고, 아래 이벤트는 퍼널과 핵심 지표에 사용한다.

## 공통·인증

| 이벤트                     | 발생 시점                          | 주요 속성                                   |
| -------------------------- | ---------------------------------- | ------------------------------------------- |
| `navigation_selected`      | 헤더·독립 화면의 주요 이동 선택    | `destination`, `source`, `is_authenticated` |
| `auth_required_redirected` | 보호 기능에서 로그인 화면으로 이동 | `target_pathname`                           |
| `oauth_login_started`      | 카카오·네이버 로그인 선택          | `provider`, `return_pathname`               |
| `oauth_login_completed`    | OAuth 콜백 처리 완료               | `provider`, `outcome`                       |
| `recovery_action_selected` | 오류 상태에서 다시 시도            | `feature`                                   |

## 가챠 검색·지도·매장

| 이벤트                         | 발생 시점                 | 주요 속성                                      |
| ------------------------------ | ------------------------- | ---------------------------------------------- |
| `category_selected`            | 카테고리 탭 선택          | `category_name`                                |
| `category_gacha_selected`      | 카테고리 가챠 선택        | `category_name`, `gacha_id`, `result_position` |
| `category_feed_more_requested` | 다음 카테고리 페이지 요청 | `category_name`, `loaded_item_count`           |
| `gacha_search_submitted`       | 가챠 검색 제출            | `query_length`                                 |
| `gacha_search_results_viewed`  | 검색 결과 수신            | `query_length`, `result_count`                 |
| `gacha_selected`               | 검색 결과의 가챠 선택     | `gacha_id`, `result_position`, `source`        |
| `store_results_loaded`         | 지도 매장 조회 성공       | `gacha_id`, `store_count`, `trigger`           |
| `store_results_failed`         | 지도 매장 조회 실패       | `gacha_id`, `trigger`                          |
| `store_selected`               | 목록·마커에서 매장 선택   | `gacha_id`, `store_id`, `source`               |
| `store_opened`                 | 매장 상세 진입            | `gacha_id`, `store_id`, `source`               |
| `map_area_researched`          | 현재 지도 영역 재검색     | `gacha_id`, `search_radius_meters`             |
| `store_detail_load_completed`  | 매장 상세 조회 완료       | `store_id`, `outcome`                          |
| `store_photo_viewed`           | 매장 사진 뷰어 열기       | `store_id`, `photo_index`, `photo_count`       |
| `store_catalog_load_completed` | 매장 보유 가챠 조회 완료  | `store_id`, `outcome`, `item_count`            |
| `store_catalog_more_requested` | 매장 보유 가챠 더 보기    | `store_id`, `loaded_item_count`                |

`gacha_id`가 `null`이면 특정 가챠를 고르지 않은 홍대 전체 매장 탐색이다.

## 거래·교환

| 이벤트                            | 발생 시점                     | 주요 속성                                                 |
| --------------------------------- | ----------------------------- | --------------------------------------------------------- |
| `trade_list_load_completed`       | 거래 목록 조회 완료           | `query_applied`, `outcome`, `result_count`, `total_count` |
| `trade_search_submitted`          | 거래 검색 제출                | `query_length`                                            |
| `trade_selected`                  | 거래 카드 선택                | `trade_id`, `status`, `source`                            |
| `trade_create_started`            | 글 등록 진입                  | `source`                                                  |
| `trade_edit_started`              | 글 수정 진입                  | `trade_id`, `source`                                      |
| `trade_delete_started`            | 글 삭제 확인창 열기           | `trade_id`, `source`                                      |
| `trade_form_submitted`            | 유효한 등록·수정 폼 제출      | 폼 모드, 이미지·카테고리 수, 선택 필드 존재 여부          |
| `trade_form_completed`            | 등록·수정 API 완료            | `mode`, `trade_id`, `outcome`                             |
| `trade_category_toggled`          | 작성 폼 카테고리 선택·해제    | `mode`, `category_id`, `action`                           |
| `trade_photo_selection_completed` | 사진 선택 검증 완료           | 허용·거절·전체 파일 수                                    |
| `trade_place_dialog_opened`       | 구매 매장·교환 장소 검색 열기 | `mode`, `place_type`                                      |
| `trade_place_search_completed`    | 장소 검색 완료                | `place_type`, `outcome`, `result_count`, `query_length`   |
| `trade_place_selected`            | 장소 검색 결과 선택           | `place_type`, `result_position`                           |
| `trade_status_update_completed`   | 거래 상태 변경 완료           | 이전·다음 상태, `outcome`                                 |
| `trade_delete_completed`          | 글 삭제 완료                  | `trade_id`, `outcome`                                     |
| `trade_chat_started`              | 거래 상세에서 채팅 선택       | `trade_id`, `is_authenticated`                            |

## 채팅·계정

| 이벤트                        | 발생 시점                        | 주요 속성                                            |
| ----------------------------- | -------------------------------- | ---------------------------------------------------- |
| `chat_room_entry_completed`   | 거래 기반 채팅방 조회·생성 완료  | `trade_id`, `room_id`, `room_was_created`, `outcome` |
| `chat_room_selected`          | 채팅 목록에서 방 선택            | `room_id`, `source`                                  |
| `chat_message_send_completed` | 텍스트 메시지 전송 완료          | `room_id`, `outcome`, `message_length`               |
| `chat_history_load_completed` | 이전 메시지 조회 완료            | `room_id`, `outcome`                                 |
| `profile_edit_started`        | 프로필 수정창 열기               | 없음                                                 |
| `profile_update_completed`    | 프로필 저장 완료                 | `outcome`, `has_trade_location`                      |
| `account_menu_selected`       | 방침·고객센터·로그아웃·탈퇴 선택 | `target`, `source`                                   |
| `account_deletion_completed`  | 회원 탈퇴 요청 완료              | `outcome`                                            |

## 권장 대시보드

1. 탐색 퍼널: `gacha_search_submitted` → `gacha_selected` → `store_selected` → `store_opened`
2. 거래 공급 퍼널: `trade_create_started` → `trade_form_submitted` → 성공한 `trade_form_completed`
3. 매칭 퍼널: `trade_selected` → `trade_chat_started` → 성공한 `chat_room_entry_completed` → 성공한 `chat_message_send_completed`
4. 기능 건강도: 각 `*_completed` 이벤트의 `outcome` 비율과 `recovery_action_selected`
5. 유지 행동: 주 단위 `category_gacha_selected`, `store_opened`, `trade_form_completed`, `chat_message_send_completed` 고유 사용자
