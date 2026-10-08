import {
  type FormEvent,
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import styled from '@emotion/styled';

import type { TradePlaceInput } from '@/domains/trade/tradeCreateType';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { loadKakaoMapsSdk } from '@/shared/map/loadKakaoMapsSdk';

import {
  searchKakaoPlaces,
  type KakaoPlaceSearchResult,
} from '../../kakaoPlaceSearch';

type LoadSdk = () => Promise<void>;
type SearchPlaces = (keyword: string) => Promise<KakaoPlaceSearchResult[]>;
type SearchStatus = 'idle' | 'loading' | 'success' | 'error';
const FOCUSABLE_ELEMENT_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface TradePlaceSearchDialogProps {
  open: boolean;
  placeType?: 'purchase_store' | 'trade_place';
  onClose: () => void;
  onSelect: (place: TradePlaceInput) => void;
  title?: string;
  description?: string;
  loadSdk?: LoadSdk;
  searchPlaces?: SearchPlaces;
}

export default function TradePlaceSearchDialog({
  open,
  placeType = 'trade_place',
  onClose,
  onSelect,
  title = '교환 장소 선택',
  description = '지하철역이나 건물명을 검색해주세요.',
  loadSdk = loadKakaoMapsSdk,
  searchPlaces = searchKakaoPlaces,
}: TradePlaceSearchDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const searchIdRef = useRef(0);
  const [keyword, setKeyword] = useState('');
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [results, setResults] = useState<KakaoPlaceSearchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    return () => {
      openerRef.current?.focus();
      openerRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isActive = true;

    setKeyword('');
    setResults([]);
    setStatus('idle');
    setErrorMessage(null);
    setIsSdkReady(false);

    async function prepareSdk() {
      try {
        await loadSdk();

        if (isActive) {
          setIsSdkReady(true);
        }
      } catch (error: unknown) {
        if (isActive) {
          setStatus('error');
          setErrorMessage(
            error instanceof Error
              ? error.message
              : '카카오 장소 검색을 준비하지 못했습니다.',
          );
        }
      }
    }

    void prepareSdk();

    return () => {
      isActive = false;
      searchIdRef.current += 1;
    };
  }, [loadSdk, open]);

  useEffect(() => {
    if (open && isSdkReady) {
      inputRef.current?.focus();
    }
  }, [isSdkReady, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const dialog = dialogRef.current;

      if (!dialog) {
        return;
      }

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENT_SELECTOR),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0]!;
      const lastElement = focusableElements.at(-1)!;
      const activeElement = document.activeElement;

      if (
        event.shiftKey &&
        (activeElement === firstElement || !dialog.contains(activeElement))
      ) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedKeyword = keyword.trim();

    if (!normalizedKeyword) {
      setStatus('error');
      setErrorMessage('검색할 장소를 입력해주세요.');
      return;
    }

    const searchId = searchIdRef.current + 1;

    searchIdRef.current = searchId;
    setStatus('loading');
    setErrorMessage(null);

    try {
      const nextResults = await searchPlaces(normalizedKeyword);

      if (searchIdRef.current !== searchId) {
        return;
      }

      setResults(nextResults);
      setStatus('success');
      captureAnalyticsEvent('trade_place_search_completed', {
        place_type: placeType,
        outcome: 'success',
        result_count: nextResults.length,
        query_length: normalizedKeyword.length,
      });
    } catch (error: unknown) {
      if (searchIdRef.current !== searchId) {
        return;
      }

      setStatus('error');
      captureAnalyticsEvent('trade_place_search_completed', {
        place_type: placeType,
        outcome: 'failure',
        result_count: 0,
        query_length: normalizedKeyword.length,
      });
      setErrorMessage(
        error instanceof Error ? error.message : '장소를 검색하지 못했습니다.',
      );
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <Backdrop onMouseDown={handleBackdropClick}>
      <DialogPanel
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trade-place-dialog-title"
        tabIndex={-1}
      >
        <DialogHeader>
          <div>
            <DialogTitle id="trade-place-dialog-title">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
          <CloseButton
            type="button"
            aria-label={`${title} 창 닫기`}
            onClick={onClose}
          >
            ×
          </CloseButton>
        </DialogHeader>

        <SearchForm onSubmit={handleSearch}>
          <SearchInput
            ref={inputRef}
            aria-label="장소 검색어"
            type="search"
            value={keyword}
            disabled={!isSdkReady}
            placeholder={
              isSdkReady ? '예: 홍대입구역' : '카카오 지도를 불러오는 중...'
            }
            onChange={(event) => setKeyword(event.target.value)}
          />
          <SearchButton
            type="submit"
            disabled={!isSdkReady || status === 'loading'}
          >
            검색
          </SearchButton>
        </SearchForm>

        <ResultArea aria-live="polite">
          {status === 'idle' ? (
            <ResultMessage>
              장소를 검색하면 결과가 여기에 표시돼요.
            </ResultMessage>
          ) : status === 'loading' ? (
            <ResultMessage role="status">장소를 검색하는 중...</ResultMessage>
          ) : status === 'error' ? (
            <ResultMessage role="alert">{errorMessage}</ResultMessage>
          ) : results.length === 0 ? (
            <ResultMessage>검색된 장소가 없어요.</ResultMessage>
          ) : (
            <ResultList aria-label="장소 검색 결과">
              {results.map((place, index) => (
                <ResultItem key={place.id}>
                  <ResultButton
                    type="button"
                    onClick={() => {
                      captureAnalyticsEvent('trade_place_selected', {
                        place_type: placeType,
                        result_position: index,
                      });
                      onSelect({
                        name: place.name,
                        address: place.address,
                        latitude: place.latitude,
                        longitude: place.longitude,
                      });
                      onClose();
                    }}
                  >
                    <PlaceName>{place.name}</PlaceName>
                    <PlaceAddress>{place.address}</PlaceAddress>
                  </ResultButton>
                </ResultItem>
              ))}
            </ResultList>
          )}
        </ResultArea>
      </DialogPanel>
    </Backdrop>
  );
}

const Backdrop = styled.div`
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  padding: 24px;
  overflow-y: auto;
  place-items: center;
  background: rgb(20 20 24 / 48%);
`;

const DialogPanel = styled.section`
  width: min(100%, 620px);
  max-height: min(760px, calc(100dvh - 48px));
  padding: 28px;
  overflow: hidden;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 24px 80px rgb(24 25 30 / 22%);
`;

const DialogHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
`;

const DialogTitle = styled.h2`
  margin: 0;
  color: #242429;
  font-size: 24px;
`;

const DialogDescription = styled.p`
  margin: 8px 0 0;
  color: #777981;
  font-size: 14px;
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #f3f3f5;
  color: #555760;
  font-size: 24px;
  cursor: pointer;
`;

const SearchForm = styled.form`
  display: grid;
  margin-top: 24px;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
`;

const SearchInput = styled.input`
  min-width: 0;
  height: 48px;
  padding: 0 14px;
  border: 1px solid #dedee3;
  border-radius: 10px;
  outline: none;
  font-size: 15px;

  &:focus {
    border-color: #ed174c;
    box-shadow: 0 0 0 3px rgb(237 23 76 / 10%);
  }
`;

const SearchButton = styled.button`
  min-width: 76px;
  padding: 0 18px;
  border: 0;
  border-radius: 10px;
  background: #ed174c;
  color: #ffffff;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.55;
  }
`;

const ResultArea = styled.div`
  min-height: 180px;
  max-height: 420px;
  margin-top: 20px;
  overflow-y: auto;
`;

const ResultMessage = styled.p`
  margin: 0;
  padding: 56px 12px;
  color: #858790;
  font-size: 14px;
  text-align: center;
`;

const ResultList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const ResultItem = styled.li`
  border-bottom: 1px solid #ededf0;
`;

const ResultButton = styled.button`
  display: flex;
  width: 100%;
  padding: 16px 10px;
  align-items: flex-start;
  flex-direction: column;
  gap: 5px;
  border: 0;
  background: #ffffff;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: #fff5f7;
  }
`;

const PlaceName = styled.strong`
  color: #292a30;
  font-size: 15px;
`;

const PlaceAddress = styled.span`
  color: #777981;
  font-size: 13px;
`;
