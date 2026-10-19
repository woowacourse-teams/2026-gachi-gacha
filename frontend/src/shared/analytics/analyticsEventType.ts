export type StoreSearchTrigger =
  'gacha_selected' | 'map_area_researched' | 'retry';
export type StoreSelectionSource = 'list' | 'map_marker';
export type AnalyticsOutcome = 'success' | 'failure';
export type TradeFormMode = 'create' | 'edit';
export type PlaceSearchContext =
  'trade_purchase_store' | 'trade_exchange_place' | 'profile_preferred_area';
export type ProfileTradeLocationChange =
  'unchanged' | 'set' | 'changed' | 'cleared';
export type EventApplicationTrack = 'BASIC' | 'COMPLETED' | 'BOTH';
export type AnalyticsImageFormat = 'jpeg' | 'png' | 'webp' | 'other';
export type AnalyticsImageSizeBucket =
  'under_1mb' | '1_to_5mb' | '5_to_10mb' | 'over_10mb';
export type LandingTourTarget = 'create' | 'map' | 'search' | 'chat';
export type NavigationDestination =
  | 'brand'
  | 'trade'
  | 'map'
  | 'search'
  | 'chat'
  | 'notifications'
  | 'mypage'
  | 'login';

interface StoreSearchContext {
  gacha_id: number | null;
  search_radius_meters: number;
  trigger: StoreSearchTrigger;
}

interface StoreResultsContext extends StoreSearchContext {
  store_count: number;
}

export interface AnalyticsEventPropertiesMap {
  navigation_selected: {
    destination: NavigationDestination;
    source:
      'header' | 'login_brand' | 'mypage' | 'privacy' | 'under_construction';
    is_authenticated: boolean | null;
  };
  oauth_login_started: {
    provider: 'kakao' | 'naver';
    return_pathname: string;
  };
  oauth_login_completed: {
    provider: 'kakao' | 'naver';
    outcome: AnalyticsOutcome;
  };
  auth_required_redirected: {
    target_pathname: string;
  };
  category_selected: {
    category_name: string;
  };
  category_gacha_selected: {
    category_name: string;
    gacha_id: number;
    result_position: number;
  };
  category_feed_more_requested: {
    category_name: string;
    loaded_item_count: number;
  };
  gacha_search_submitted: {
    query_length: number;
  };
  gacha_search_results_viewed: {
    query_length: number;
    result_count: number;
  };
  gacha_search_failed: {
    query_length: number;
  };
  gacha_selected: {
    gacha_id: number;
    result_position: number;
    source: 'search_popover' | 'store_catalog';
  };
  store_results_loaded: StoreResultsContext;
  store_discovery_succeeded: StoreResultsContext;
  store_results_failed: StoreSearchContext;
  store_selected: {
    gacha_id: number | null;
    store_id: number;
    source: StoreSelectionSource;
  };
  store_opened: {
    gacha_id: number | null;
    store_id: number;
    source: 'list' | 'map_marker';
  };
  store_detail_load_completed: {
    store_id: number;
    outcome: AnalyticsOutcome;
  };
  store_photo_viewed: {
    store_id: number;
    photo_index: number;
    photo_count: number;
    source:
      | 'gallery'
      | 'viewer_previous'
      | 'viewer_next'
      | 'viewer_thumbnail'
      | 'viewer_scroll';
  };
  store_catalog_more_requested: {
    store_id: number;
    loaded_item_count: number;
  };
  store_catalog_load_completed: {
    store_id: number;
    outcome: AnalyticsOutcome;
    item_count: number;
  };
  map_area_researched: {
    gacha_id: number | null;
    search_radius_meters: number;
  };
  trade_search_submitted: {
    query_length: number;
  };
  trade_list_load_completed: {
    query_applied: boolean;
    outcome: AnalyticsOutcome;
    result_count: number;
    total_count: number;
  };
  trade_selected: {
    trade_id: number;
    status: 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
    source: 'trade_list' | 'related_list' | 'mypage';
  };
  trade_create_started: {
    source: 'floating_button' | 'empty_state';
  };
  trade_edit_started: {
    trade_id: number;
    source: 'trade_detail' | 'mypage';
  };
  trade_delete_started: {
    trade_id: number;
    source: 'trade_detail' | 'mypage';
  };
  trade_detail_photo_selected: {
    trade_id: number;
    photo_index: number;
    photo_count: number;
    source:
      | 'gallery_previous'
      | 'gallery_next'
      | 'thumbnail'
      | 'viewer_previous'
      | 'viewer_next'
      | 'viewer_thumbnail'
      | 'viewer_scroll';
  };
  trade_detail_photo_viewer_opened: {
    trade_id: number;
    photo_index: number;
    photo_count: number;
  };
  trade_list_more_requested: {
    query_applied: boolean;
    loaded_item_count: number;
    source: 'trade_list' | 'related_list';
  };
  trade_form_submitted: {
    mode: TradeFormMode;
    trade_id: number | null;
    image_count: number;
    category_count: number;
    has_purchase_store: boolean;
    has_trade_place: boolean;
    has_desired_product: boolean;
  };
  trade_form_completed: {
    mode: TradeFormMode;
    trade_id: number | null;
    outcome: AnalyticsOutcome;
  };
  trade_category_toggled: {
    mode: TradeFormMode;
    category_id: number;
    action: 'selected' | 'removed';
  };
  trade_photo_selection_completed: {
    accepted_count: number;
    rejected_count: number;
    total_count: number;
  };
  place_search_opened: {
    place_context: PlaceSearchContext;
    trade_form_mode: TradeFormMode | null;
  };
  place_search_completed: {
    place_context: PlaceSearchContext;
    trade_form_mode: TradeFormMode | null;
    outcome: AnalyticsOutcome;
    result_count: number;
    query_length: number;
  };
  place_search_result_selected: {
    place_context: PlaceSearchContext;
    trade_form_mode: TradeFormMode | null;
    result_position: number;
  };
  place_selection_cleared: {
    place_context: PlaceSearchContext;
    trade_form_mode: TradeFormMode | null;
  };
  trade_status_update_completed: {
    trade_id: number;
    previous_status: 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
    next_status: 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
    outcome: AnalyticsOutcome;
  };
  trade_delete_completed: {
    trade_id: number;
    outcome: AnalyticsOutcome;
  };
  trade_chat_started: {
    trade_id: number;
    is_authenticated: boolean;
    comment_context: 'none' | 'submitted_this_session';
  };
  trade_comments_load_completed: {
    trade_id: number;
    outcome: AnalyticsOutcome;
    comment_count: number;
  };
  trade_comment_submission_completed: {
    trade_id: number;
    author_type: 'member' | 'guest';
    outcome: AnalyticsOutcome;
    comment_length: number;
    has_custom_guest_nickname: boolean;
  };
  chat_room_entry_completed: {
    trade_id: number;
    room_id: number | null;
    room_was_created: boolean;
    outcome: AnalyticsOutcome;
  };
  chat_room_selected: {
    room_id: number;
    source: 'conversation_list';
  };
  chat_message_send_completed: {
    room_id: number;
    outcome: AnalyticsOutcome;
    message_length: number;
  };
  chat_history_load_completed: {
    room_id: number;
    outcome: AnalyticsOutcome;
  };
  chat_trade_context_selected: {
    room_id: number;
    trade_id: number;
    action: 'trade_detail' | 'report';
  };
  profile_edit_started: Record<string, never>;
  mypage_trades_load_completed: {
    outcome: AnalyticsOutcome;
    total_count: number;
    in_progress_count: number;
  };
  profile_image_selection_completed: {
    outcome: AnalyticsOutcome;
    rejection_reason: 'none' | 'too_large' | 'unsupported_type';
    format: AnalyticsImageFormat;
    size_bucket: AnalyticsImageSizeBucket;
  };
  profile_image_upload_started: {
    format: AnalyticsImageFormat;
    size_bucket: AnalyticsImageSizeBucket;
  };
  profile_image_upload_completed: {
    outcome: AnalyticsOutcome;
    format: AnalyticsImageFormat;
    size_bucket: AnalyticsImageSizeBucket;
  };
  profile_update_completed: {
    outcome: AnalyticsOutcome;
    has_trade_location: boolean;
    trade_location_change: ProfileTradeLocationChange;
    image_change: 'unchanged' | 'replaced';
  };
  account_menu_selected: {
    target: 'updates' | 'privacy' | 'support' | 'logout' | 'delete_account';
    source: 'login' | 'mypage';
  };
  account_deletion_completed: {
    outcome: AnalyticsOutcome;
  };
  event_application_started: {
    source: 'mypage';
  };
  event_application_completed: {
    track: EventApplicationTrack;
    outcome: AnalyticsOutcome;
    has_completed_trade_evidence: boolean;
  };
  landing_tour_step_viewed: {
    tour_version: string;
    step_number: number;
    target: LandingTourTarget;
  };
  landing_tour_exited: {
    tour_version: string;
    exit_type: 'completed' | 'skip_button' | 'close_button';
    last_step_number: number;
  };
  updates_page_viewed: {
    latest_visible_version: string;
    release_count: number;
  };
  release_notes_selected: {
    version: string;
    is_latest: boolean;
  };
  recovery_action_selected: {
    feature:
      | 'auth_session'
      | 'trade_list'
      | 'trade_detail'
      | 'chat'
      | 'store_search'
      | 'store_detail'
      | 'store_catalog'
      | 'mypage_trades';
  };
}

export type AnalyticsEventName = keyof AnalyticsEventPropertiesMap;

export type AnalyticsEventProperties<EventName extends AnalyticsEventName> =
  AnalyticsEventPropertiesMap[EventName];
