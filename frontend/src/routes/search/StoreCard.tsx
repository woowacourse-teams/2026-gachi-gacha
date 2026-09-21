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
  onSelect: (storeId: number) => void;
}

export function StoreCard({
  store,
  isSelected = false,
  onSelect,
}: StoreCardProps) {
  const { storeId, name, thumbnailUrl, address } = store;

  return (
    <Card>
      <CardButton
        type="button"
        $isSelected={isSelected}
        aria-pressed={isSelected}
        onClick={() => onSelect(storeId)}
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
              ? '지도에서 선택한 매장'
              : '선택하면 지도에서 확인할 수 있어요'}
          </SelectionHint>
        </Information>
      </CardButton>
    </Card>
  );
}
