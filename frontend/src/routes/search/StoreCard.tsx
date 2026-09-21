import type { NearbyStoreResponseDto } from './api/nearbyStoresResponseType';
import {
  Address,
  Card,
  CardButton,
  Heading,
  Information,
  SelectionHint,
  StoreName,
  Thumbnail,
  ThumbnailFallback,
  ThumbnailFrame,
} from './StoreCard.styles';

export interface StoreCardProps {
  store: NearbyStoreResponseDto;
  isSelected?: boolean;
  onOpen: (storeId: number) => void;
  onSelect: (storeId: number) => void;
}

export function StoreCard({
  store,
  isSelected = false,
  onOpen,
  onSelect,
}: StoreCardProps) {
  const { storeId, name, thumbnailUrl, address } = store;
  const handleClick = () => {
    if (isSelected) {
      onOpen(storeId);
      return;
    }

    onSelect(storeId);
  };

  return (
    <Card>
      <CardButton
        type="button"
        $isSelected={isSelected}
        aria-pressed={isSelected}
        aria-label={
          isSelected
            ? `${name} 매장 상세 페이지로 이동`
            : `${name} 매장을 지도에서 선택`
        }
        onClick={handleClick}
      >
        <ThumbnailFrame>
          <ThumbnailFallback aria-hidden="true">G</ThumbnailFallback>
          {thumbnailUrl && (
            <Thumbnail
              src={thumbnailUrl}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          )}
        </ThumbnailFrame>
        <Information>
          <Heading>
            <StoreName title={name}>{name}</StoreName>
          </Heading>
          <Address title={address}>{address}</Address>
          <SelectionHint>
            {isSelected
              ? '한 번 더 누르면 매장 상세로 이동 →'
              : '선택하면 지도에서 확인할 수 있어요'}
          </SelectionHint>
        </Information>
      </CardButton>
    </Card>
  );
}
