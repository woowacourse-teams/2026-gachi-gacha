import { useCallback, useEffect, useState } from 'react';

import {
  captureGachaCatalogInterestClicked,
  captureGachaCatalogInterestViewed,
} from '../analytics/gachaCatalogInterestAnalytics';

const INTEREST_STORAGE_PREFIX = 'gacha-catalog-interest';
const IMPRESSION_STORAGE_PREFIX = 'gacha-catalog-interest-impression';
const capturedImpressionStoreIds = new Set<number>();

function createStorageKey(prefix: string, storeId: number) {
  return `${prefix}:${storeId}`;
}

function readInterest(storeId: number) {
  try {
    return (
      window.localStorage.getItem(
        createStorageKey(INTEREST_STORAGE_PREFIX, storeId),
      ) === 'true'
    );
  } catch {
    return false;
  }
}

function saveInterest(storeId: number) {
  try {
    window.localStorage.setItem(
      createStorageKey(INTEREST_STORAGE_PREFIX, storeId),
      'true',
    );
  } catch {
    // 저장소 사용이 제한되어도 현재 화면의 요청 상태와 분석 이벤트는 유지한다.
  }
}

function markImpression(storeId: number) {
  if (capturedImpressionStoreIds.has(storeId)) return false;

  const storageKey = createStorageKey(IMPRESSION_STORAGE_PREFIX, storeId);

  try {
    if (window.sessionStorage.getItem(storageKey) === 'true') return false;

    window.sessionStorage.setItem(storageKey, 'true');
  } catch {
    // 세션 저장소가 제한된 환경에서는 메모리 기준으로 중복 노출을 방지한다.
  }

  capturedImpressionStoreIds.add(storeId);

  return true;
}

export function useGachaCatalogInterest(storeId: number, storeName: string) {
  const [isInterested, setIsInterested] = useState(() => readInterest(storeId));

  useEffect(() => {
    if (!markImpression(storeId)) return;

    captureGachaCatalogInterestViewed(storeId, storeName, isInterested);
  }, [isInterested, storeId, storeName]);

  const requestInterest = useCallback(() => {
    if (isInterested) return;

    saveInterest(storeId);
    setIsInterested(true);
    captureGachaCatalogInterestClicked(storeId, storeName);
  }, [isInterested, storeId, storeName]);

  return { isInterested, requestInterest };
}
