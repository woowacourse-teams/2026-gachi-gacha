import { useCallback, useEffect, useRef, useState } from 'react';

import { getStoreGachaPage } from '../api/getStoreGachaImageUrls';

interface UseGachaCatalogPagesParams {
  storeId: number;
  /** 시트를 열 때 이미 받아둔 첫 페이지. 다시 받지 않는다. */
  firstPageImageUrls: string[];
  totalPages: number;
}

/**
 * 가챠 사진을 페이지 단위로 이어 받는다.
 *
 * 시트를 열 때는 첫 페이지만 받고, 전체 보기에서 스크롤이 끝에 닿을 때마다
 * 다음 페이지를 부른다. 한 번에 다 받으면 시트 여는 시간이 카탈로그 크기를
 * 따라가고, 한 번에 다 그리면 사진 수만큼 DOM 이 생긴다.
 */
export function useGachaCatalogPages({
  storeId,
  firstPageImageUrls,
  totalPages,
}: UseGachaCatalogPagesParams) {
  const [imageUrls, setImageUrls] = useState(firstPageImageUrls);
  const [loadedPage, setLoadedPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  /** 같은 페이지를 두 번 부르지 않도록 진행 중인 요청을 기억한다. */
  const pendingPageRef = useRef<number | null>(null);

  useEffect(() => {
    setImageUrls(firstPageImageUrls);
    setLoadedPage(0);
    setIsLoading(false);
    setHasFailed(false);
    pendingPageRef.current = null;
  }, [storeId, firstPageImageUrls]);

  const hasMore = loadedPage + 1 < totalPages;

  const loadMore = useCallback(() => {
    const nextPage = loadedPage + 1;

    if (nextPage >= totalPages) return;
    if (pendingPageRef.current === nextPage) return;

    pendingPageRef.current = nextPage;
    setIsLoading(true);
    setHasFailed(false);

    getStoreGachaPage(storeId, nextPage)
      .then((page) => {
        setImageUrls((urls) => [
          ...urls,
          ...page.imageUrls.filter((url) => !urls.includes(url)),
        ]);
        setLoadedPage(page.page);
      })
      .catch(() => setHasFailed(true))
      .finally(() => {
        pendingPageRef.current = null;
        setIsLoading(false);
      });
  }, [loadedPage, storeId, totalPages]);

  return { hasFailed, hasMore, imageUrls, isLoading, loadMore };
}
