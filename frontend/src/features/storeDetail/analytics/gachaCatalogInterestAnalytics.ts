const GACHA_CATALOG_INTEREST_VIEWED = 'gacha_catalog_interest_viewed';
const GACHA_CATALOG_INTEREST_CLICKED = 'gacha_catalog_interest_clicked';

function getEnvironment() {
  return window.location.hostname === 'gachigacha.kro.kr'
    ? 'production'
    : 'development';
}

function captureGachaCatalogInterest(
  eventName:
    | typeof GACHA_CATALOG_INTEREST_VIEWED
    | typeof GACHA_CATALOG_INTEREST_CLICKED,
  storeId: number,
  storeName: string,
  properties: Record<string, unknown> = {},
) {
  window.posthog?.capture(eventName, {
    eligibility_reason: 'missing_instagram_and_gacha_images',
    environment: getEnvironment(),
    source: 'store_detail_gacha_tab',
    store_id: storeId,
    store_name: storeName,
    ...properties,
  });
}

export function captureGachaCatalogInterestViewed(
  storeId: number,
  storeName: string,
  alreadyInterested: boolean,
) {
  captureGachaCatalogInterest(
    GACHA_CATALOG_INTEREST_VIEWED,
    storeId,
    storeName,
    {
      already_interested: alreadyInterested,
    },
  );
}

export function captureGachaCatalogInterestClicked(
  storeId: number,
  storeName: string,
) {
  captureGachaCatalogInterest(
    GACHA_CATALOG_INTEREST_CLICKED,
    storeId,
    storeName,
  );
}
