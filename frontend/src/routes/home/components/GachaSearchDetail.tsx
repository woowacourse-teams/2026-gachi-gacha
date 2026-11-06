import { useState } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router';

import { createGachaSearchResultsUrl } from '@/domains/product/gachaRoute';
import { useSelectedGacha } from '@/routes/search/selectedGacha/useSelectedGacha';
import { useSearchStores } from '@/routes/search/storeResults/useSearchStores';
import { LogoImagePlaceholder } from '@/shared/ui/LogoImagePlaceholder';
import { PhotoViewer } from '@/shared/ui/PhotoViewer';

import { SEARCH_STORE_AREA } from './SearchCatalogResults';

export default function GachaSearchDetail({
  id,
  backTo,
}: {
  id: number;
  backTo: string;
}) {
  const [attempt, setAttempt] = useState(0);

  return (
    <Detail>
      <Link to={backTo}>‹ 검색 결과로 돌아가기</Link>
      <GachaContent
        key={attempt}
        id={id}
        retry={() => setAttempt((value) => value + 1)}
      />
    </Detail>
  );
}

function GachaContent({ id, retry }: { id: number; retry: () => void }) {
  const state = useSelectedGacha(id);
  const { storesState } = useSearchStores(
    state.status === 'success' ? { ...SEARCH_STORE_AREA, gachaId: id } : null,
  );
  const [viewerOpen, setViewerOpen] = useState(false);

  if (state.status === 'error') {
    return (
      <div>
        <p role="alert">{state.errorMessage}</p>
        <button type="button" onClick={retry}>
          다시 시도
        </button>
      </div>
    );
  }

  if (state.status !== 'success') {
    return <p role="status">가챠를 불러오고 있어요.</p>;
  }

  const { name, thumbnailUrl, categories } = state.data;

  return (
    <>
      <Content>
        <Photo>
          {thumbnailUrl ? (
            <button
              type="button"
              aria-label="가챠 사진 크게 보기"
              onClick={() => setViewerOpen(true)}
            >
              <img src={thumbnailUrl} alt={name} />
            </button>
          ) : (
            <LogoImagePlaceholder />
          )}
        </Photo>
        <Info>
          <h1>{name}</h1>
          {categories.length > 0 && <p>{categories.join(' · ')}</p>}
          {storesState.status === 'success' && (
            <StoreCount>
              <span>홍대 주변 보유 매장</span>
              <strong>{storesState.data.stores.length}곳</strong>
            </StoreCount>
          )}
          <MapLink to={createGachaSearchResultsUrl(id)}>
            보유 매장 지도에서 보기
          </MapLink>
        </Info>
      </Content>
      {viewerOpen && thumbnailUrl && (
        <PhotoViewer
          imageUrls={[thumbnailUrl]}
          initialIndex={0}
          title={name}
          dialogLabel="가챠 사진 크게 보기"
          imageAltPrefix={name}
          thumbnailListLabel="가챠 사진 목록"
          closeLabel="가챠 사진 닫기"
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}

const Detail = styled.section`
  box-sizing: border-box;
  width: min(100%, 1264px);
  margin: 0 auto;
  padding: 24px 32px 64px;

  > a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: inherit;
    text-decoration: none;
  }

  @media (max-width: 767px) {
    padding: 0 16px 88px;
  }
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: 32px;

  @media (max-width: 767px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
`;

const Photo = styled.div`
  display: grid;
  aspect-ratio: 1;
  overflow: hidden;
  place-items: center;
  background: #f5f4f3;

  button {
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: zoom-in;
  }
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const Info = styled.div`
  min-width: 0;
  overflow-wrap: anywhere;

  h1 {
    margin: 0 0 12px;
    font-size: 24px;
  }
  p {
    color: #706d71;
  }
`;

const MapLink = styled(Link)`
  display: grid;
  min-height: 48px;
  margin-top: 24px;
  place-items: center;
  border-radius: 10px;
  background: #d73352;
  color: #fff;
  font-weight: 700;
  text-decoration: none;

  @media (max-width: 767px) {
    position: fixed;
    z-index: 5;
    inset: auto 16px calc(12px + env(safe-area-inset-bottom)) 16px;
  }
`;

const StoreCount = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  padding-block: 12px;
  border-top: 1px solid #ececef;
  border-bottom: 1px solid #ececef;

  strong {
    color: #b52a47;
  }
`;
