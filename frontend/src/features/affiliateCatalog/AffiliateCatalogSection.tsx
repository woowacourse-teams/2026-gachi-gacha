import { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';

import type { AffiliateCatalog } from './affiliateCatalogType';
import { AFFILIATE_CATALOG } from './generatedCatalog';
import { getVisibleAffiliateProducts } from './getVisibleAffiliateProducts';

const IMAGE_LOAD_TIMEOUT_MS = 8_000;

type ImageStatus = 'loaded' | 'failed';

interface ImageState {
  signature: string;
  statusByProductId: Readonly<Record<string, ImageStatus>>;
}

interface AffiliateCatalogSectionProps {
  categoryName: string;
  placementPath: string;
  catalog?: AffiliateCatalog;
}

export function AffiliateCatalogSection({
  categoryName,
  placementPath,
  catalog = AFFILIATE_CATALOG,
}: AffiliateCatalogSectionProps) {
  const candidates = useMemo(
    () =>
      getVisibleAffiliateProducts({
        catalog,
        categoryName,
        placementPath,
      }),
    [catalog, categoryName, placementPath],
  );
  const signature = candidates
    .map(({ id, thumbnailUrl }) => `${id}:${thumbnailUrl}`)
    .join('|');
  const [imageState, setImageState] = useState<ImageState>({
    signature,
    statusByProductId: {},
  });
  const statusByProductId =
    imageState.signature === signature ? imageState.statusByProductId : {};
  const settled = candidates.every(({ id }) => statusByProductId[id]);
  const products = candidates.filter(
    ({ id }) => statusByProductId[id] === 'loaded',
  );
  const productSignature = products.map(({ id }) => id).join('|');

  useEffect(() => {
    setImageState({ signature, statusByProductId: {} });

    if (!signature) return;

    const timeoutId = window.setTimeout(() => {
      setImageState((current) => {
        const currentStatuses =
          current.signature === signature ? current.statusByProductId : {};
        const nextStatuses = { ...currentStatuses };

        candidates.forEach(({ id }) => {
          nextStatuses[id] ??= 'failed';
        });

        return { signature, statusByProductId: nextStatuses };
      });
    }, IMAGE_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [candidates, signature]);

  useEffect(() => {
    if (!settled || products.length === 0) return;

    captureAnalyticsEvent('affiliate_catalog_viewed', {
      category_name: categoryName,
      placement_path: placementPath,
      product_count: products.length,
    });
  }, [categoryName, placementPath, productSignature, products.length, settled]);

  function updateImageStatus(productId: string, status: ImageStatus) {
    setImageState((current) => ({
      signature,
      statusByProductId: {
        ...(current.signature === signature ? current.statusByProductId : {}),
        [productId]: status,
      },
    }));
  }

  if (candidates.length === 0) return null;

  return (
    <>
      <ImagePreloadPool aria-hidden="true">
        {candidates.map((product) => (
          <img
            key={`${product.id}:${product.thumbnailUrl}`}
            src={product.thumbnailUrl}
            alt=""
            referrerPolicy="no-referrer"
            onLoad={() => updateImageStatus(product.id, 'loaded')}
            onError={() => updateImageStatus(product.id, 'failed')}
          />
        ))}
      </ImagePreloadPool>

      {products.length > 0 && (
        <Section aria-labelledby="affiliate-catalog-title">
          <Header>
            <TitleRow>
              <PartnershipBadge>제휴</PartnershipBadge>
              <Title id="affiliate-catalog-title">
                네이버 쇼핑에서 파는 {categoryName} 굿즈
              </Title>
            </TitleRow>
            <Disclosure>
              이 포스팅은 네이버 쇼핑 커넥트 활동의 일환으로, 판매 발생 시
              수수료를 제공받습니다.
            </Disclosure>
          </Header>

          <ProductList>
            {products.map((product, index) => (
              <ProductLink
                key={product.id}
                href={product.affiliateUrl}
                target="_blank"
                rel="sponsored noopener noreferrer"
                onClick={() =>
                  captureAnalyticsEvent('affiliate_product_selected', {
                    product_id: product.id,
                    category_name: categoryName,
                    placement_path: placementPath,
                    result_position: index,
                  })
                }
              >
                <Thumbnail
                  src={product.thumbnailUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={() => updateImageStatus(product.id, 'failed')}
                />
                <ProductTitle>{product.title}</ProductTitle>
                <ExternalHint aria-hidden="true">
                  네이버에서 보기 ↗
                </ExternalHint>
              </ProductLink>
            ))}
          </ProductList>
        </Section>
      )}
    </>
  );
}

const ImagePreloadPool = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

const Section = styled.section`
  box-sizing: border-box;
  width: 100%;
  max-width: 1184px;
  margin: 8px auto 0;
  padding: 24px;
  border: 1px solid #eeeaec;
  border-radius: 20px;
  background: #fbfafc;
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PartnershipBadge = styled.span`
  flex: none;
  padding: 5px 9px;
  border-radius: 7px;
  background: #24253a;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
`;

const Title = styled.h2`
  margin: 0;
  color: #2b2528;
  font-size: 18px;
  font-weight: 800;
`;

const Disclosure = styled.p`
  margin: 0;
  color: #756b70;
  font-size: 13px;
  line-height: 1.5;
`;

const ProductList = styled.div`
  display: flex;
  margin-top: 18px;
  gap: 14px;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  padding: 2px 2px 10px;
  scroll-padding-inline: 2px;
  scroll-snap-type: inline mandatory;
  scrollbar-width: thin;
`;

const ProductLink = styled.a`
  display: flex;
  width: min(232px, 72vw);
  flex: 0 0 min(232px, 72vw);
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #ece8e9;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 5px 16px rgb(36 33 34 / 8%);
  color: inherit;
  scroll-snap-align: start;
  text-decoration: none;

  &:focus-visible {
    outline: 3px solid #d93652;
    outline-offset: 3px;
  }
`;

const Thumbnail = styled.img`
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  background: #f6f3f4;
`;

const ProductTitle = styled.strong`
  display: -webkit-box;
  min-height: 42px;
  margin: 14px 14px 6px;
  overflow: hidden;
  color: #2b2528;
  font-size: 15px;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

const ExternalHint = styled.span`
  margin: auto 14px 14px;
  color: #8c8186;
  font-size: 12px;
`;

export default AffiliateCatalogSection;
