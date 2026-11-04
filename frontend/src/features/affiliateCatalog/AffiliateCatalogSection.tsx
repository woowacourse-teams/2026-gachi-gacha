import { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';

import { GachaSummaryCard } from '@/domains/product/components/GachaSummaryCard';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import {
  breakpoint,
  color,
  fontSize,
  fontWeight,
  radius,
  shadow,
  space,
} from '@/shared/styles/tokens';

import type { AffiliateCatalog } from './affiliateCatalogType';
import { AFFILIATE_CATALOG } from './generatedCatalog';
import { getVisibleAffiliateProducts } from './getVisibleAffiliateProducts';
import { useMouseDragScroll } from './useMouseDragScroll';

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
  const { dragHandlers, isDragging } = useMouseDragScroll();
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
              이 굿즈들은 네이버 쇼핑 커넥트 제휴로, 판매 발생 시 수수료를
              제공받습니다.
            </Disclosure>
          </Header>

          <ProductList
            {...dragHandlers}
            $isDragging={isDragging}
            role="group"
            aria-label={`${categoryName} 제휴 상품 목록`}
          >
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
                <GachaSummaryCard
                  product={{
                    name: product.title,
                    thumbnailUrl: product.thumbnailUrl,
                    categories: product.categories.map(({ name }) => name),
                  }}
                  imageAlt=""
                  supportingContent={
                    <ExternalHint aria-hidden="true">
                      네이버에서 보기 ↗
                    </ExternalHint>
                  }
                />
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
  padding: ${space.xl};
  border: 1px solid ${color.border};
  border-radius: ${radius.dialog};
  background: ${color.surfaceMuted};

  @media (max-width: ${breakpoint.mobile}) {
    padding: ${space.md};
    border-radius: ${radius.card};
  }
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
  border-radius: ${radius.small};
  background: #24253a;
  color: ${color.surface};
  font-size: ${fontSize.caption};
  font-weight: ${fontWeight.bold};
`;

const Title = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${fontSize.subheading};
  font-weight: ${fontWeight.extraBold};
`;

const Disclosure = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${fontSize.label};
  line-height: 1.5;
`;

const ProductList = styled.div<{ $isDragging: boolean }>`
  display: flex;
  margin-top: ${space.lg};
  gap: ${space.md};
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  padding: 2px 2px ${space.sm};
  scroll-padding-inline: 2px;
  scroll-snap-type: inline mandatory;
  scrollbar-width: thin;
  cursor: ${({ $isDragging }) => ($isDragging ? 'grabbing' : 'grab')};
  user-select: ${({ $isDragging }) => ($isDragging ? 'none' : 'auto')};
`;

const ProductLink = styled.a`
  display: block;
  width: min(220px, 72vw);
  flex: 0 0 min(220px, 72vw);
  padding: ${space.xs};
  border: 1px solid ${color.border};
  border-radius: ${radius.card};
  background: ${color.surface};
  box-shadow: ${shadow.card};
  color: inherit;
  scroll-snap-align: start;
  text-decoration: none;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;

  &:hover {
    border-color: rgb(217 59 84 / 30%);
    box-shadow: 0 12px 28px rgb(36 33 34 / 14%);
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 3px;
  }
`;

const ExternalHint = styled.span`
  display: block;
  margin-top: ${space.xs};
  color: ${color.primary};
  font-size: ${fontSize.caption};
  font-weight: ${fontWeight.medium};
`;

export default AffiliateCatalogSection;
