type StoreSearchTrigger = 'gacha_selected' | 'map_area_researched' | 'retry';
type StoreSelectionSource = 'list' | 'map_marker';

interface StoreSearchContext {
  gacha_id: number;
  search_radius_meters: number;
  trigger: StoreSearchTrigger;
}

interface StoreResultsContext extends StoreSearchContext {
  store_count: number;
}

export interface AnalyticsEventPropertiesMap {
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
    source: 'search_popover';
  };
  store_results_loaded: StoreResultsContext;
  store_discovery_succeeded: StoreResultsContext;
  store_results_failed: StoreSearchContext;
  store_selected: {
    gacha_id: number;
    store_id: number;
    source: StoreSelectionSource;
  };
  map_area_researched: {
    gacha_id: number;
    search_radius_meters: number;
  };
}

export type AnalyticsEventName = keyof AnalyticsEventPropertiesMap;

export type AnalyticsEventProperties<EventName extends AnalyticsEventName> =
  AnalyticsEventPropertiesMap[EventName];
