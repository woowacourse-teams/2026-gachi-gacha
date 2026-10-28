import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';

export function captureGachaSearchSubmitted(query: string): void {
  captureAnalyticsEvent('gacha_search_submitted', {
    query_length: query.length,
  });
}

export function captureGachaSearchResultsViewed(
  query: string,
  resultCount: number,
): void {
  captureAnalyticsEvent('gacha_search_results_viewed', {
    query_length: query.length,
    result_count: resultCount,
  });
}

export function captureGachaSearchFailed(query: string): void {
  captureAnalyticsEvent('gacha_search_failed', {
    query_length: query.length,
  });
}

export function captureGachaSelected(
  gachaId: number,
  resultPosition: number,
): void {
  captureAnalyticsEvent('gacha_selected', {
    gacha_id: gachaId,
    result_position: resultPosition,
    source: 'search_popover',
  });
}
