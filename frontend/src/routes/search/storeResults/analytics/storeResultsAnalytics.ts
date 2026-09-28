import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import type {
  StoreSearchTrigger,
  StoreSelectionSource,
} from '@/shared/analytics/analyticsEventType';

export function captureStoreSearchSucceeded(
  gachaId: number,
  searchRadiusMeters: number,
  trigger: StoreSearchTrigger,
  storeCount: number,
): void {
  const properties = {
    gacha_id: gachaId,
    search_radius_meters: searchRadiusMeters,
    store_count: storeCount,
    trigger,
  };

  captureAnalyticsEvent('store_results_loaded', properties);

  if (storeCount > 0) {
    captureAnalyticsEvent('store_discovery_succeeded', properties);
  }
}

export function captureStoreSearchFailed(
  gachaId: number,
  searchRadiusMeters: number,
  trigger: StoreSearchTrigger,
): void {
  captureAnalyticsEvent('store_results_failed', {
    gacha_id: gachaId,
    search_radius_meters: searchRadiusMeters,
    trigger,
  });
}

export function captureMapAreaResearched(
  gachaId: number,
  searchRadiusMeters: number,
): void {
  captureAnalyticsEvent('map_area_researched', {
    gacha_id: gachaId,
    search_radius_meters: searchRadiusMeters,
  });
}

export function captureStoreSelected(
  gachaId: number,
  storeId: number,
  source: StoreSelectionSource,
): void {
  captureAnalyticsEvent('store_selected', {
    gacha_id: gachaId,
    store_id: storeId,
    source,
  });
}
