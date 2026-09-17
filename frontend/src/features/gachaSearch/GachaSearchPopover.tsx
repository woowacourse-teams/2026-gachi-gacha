import type { GachaProductSummary } from '@/domains/product/gachaProductType';
import type { AsyncState } from '@/shared/hooks/asyncStateType';

import {
  CategoryText,
  CloseButton,
  Content,
  EmptyState,
  ErrorMessage,
  Header,
  HelperText,
  ImageFallback,
  LoadingCard,
  LoadingGrid,
  Popover,
  ProductButton,
  ProductImage,
  ProductImageFrame,
  ProductItem,
  ProductList,
  ProductName,
  ResultCount,
  ResultSummary,
  RetryButton,
  Title,
} from './GachaSearchPopover.styles';

export interface GachaSearchPopoverProps {
  query: string;
  searchState: AsyncState<readonly GachaProductSummary[]>;
  onClose: () => void;
  onRetry?: () => void;
  onSelect: (gachaId: number) => void;
}

interface ProductCardProps {
  product: GachaProductSummary;
  onSelect: (gachaId: number) => void;
}

function ProductCard({ product, onSelect }: ProductCardProps) {
  const categories = product.categories.slice(0, 2).join(' · ');

  return (
    <ProductItem>
      <ProductButton
        type="button"
        onClick={() => onSelect(product.gachaId)}
        aria-label={`${product.name} 선택`}
      >
        <ProductImageFrame>
          <ImageFallback aria-hidden="true">G</ImageFallback>
          {product.thumbnailUrl && (
            <ProductImage
              src={product.thumbnailUrl}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          )}
        </ProductImageFrame>
        <ProductName>{product.name}</ProductName>
        <CategoryText>{categories || '카테고리 미등록'}</CategoryText>
      </ProductButton>
    </ProductItem>
  );
}

function LoadingContent() {
  return (
    <LoadingGrid aria-label="가챠 검색 결과를 불러오는 중" aria-busy="true">
      {Array.from({ length: 10 }, (_, index) => (
        <LoadingCard key={index} aria-hidden="true" />
      ))}
    </LoadingGrid>
  );
}

export function GachaSearchPopover({
  query,
  searchState,
  onClose,
  onRetry,
  onSelect,
}: GachaSearchPopoverProps) {
  const trimmedQuery = query.trim();

  return (
    <Popover aria-label="가챠 검색 결과">
      <Header>
        <div>
          <Title>
            {trimmedQuery ? `‘${trimmedQuery}’ 검색 결과` : '가챠 검색'}
          </Title>
          <HelperText>
            가챠를 선택하면 보유 매장과 위치를 확인할 수 있어요.
          </HelperText>
        </div>
        <CloseButton
          type="button"
          onClick={onClose}
          aria-label="검색 결과 닫기"
        >
          ×
        </CloseButton>
      </Header>

      <Content aria-live="polite">
        {searchState.status === 'idle' && (
          <EmptyState>찾고 싶은 가챠 이름을 입력해 주세요.</EmptyState>
        )}

        {searchState.status === 'loading' && <LoadingContent />}

        {searchState.status === 'error' && (
          <EmptyState>
            <ErrorMessage>{searchState.errorMessage}</ErrorMessage>
            {onRetry && (
              <RetryButton type="button" onClick={onRetry}>
                다시 시도
              </RetryButton>
            )}
          </EmptyState>
        )}

        {searchState.status === 'success' && searchState.data.length === 0 && (
          <EmptyState>검색어와 일치하는 가챠가 없습니다.</EmptyState>
        )}

        {searchState.status === 'success' && searchState.data.length > 0 && (
          <>
            <ResultSummary>
              <span>관련 가챠</span>
              <ResultCount>{searchState.data.length}개 표시</ResultCount>
            </ResultSummary>
            <ProductList>
              {searchState.data.map((product) => (
                <ProductCard
                  key={product.gachaId}
                  product={product}
                  onSelect={onSelect}
                />
              ))}
            </ProductList>
          </>
        )}
      </Content>
    </Popover>
  );
}
