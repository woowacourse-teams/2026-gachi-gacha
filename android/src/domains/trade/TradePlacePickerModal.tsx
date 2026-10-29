import { KakaoPlaceSearchModal } from '../place/KakaoPlaceSearchModal';
import type { PlaceSearchSelection } from '../place/placeSearchTypes';
import type { TradePlaceInput } from './tradeTypes';

type Props = {
  onClose: () => void;
  onSelect: (place: TradePlaceInput) => void;
  title: string;
  visible: boolean;
};

export function TradePlacePickerModal({
  onClose,
  onSelect,
  title,
  visible,
}: Props) {
  function selectPlace(place: PlaceSearchSelection) {
    onSelect(place);
  }

  return (
    <KakaoPlaceSearchModal
      onClose={onClose}
      onSelect={selectPlace}
      title={title}
      visible={visible}
    />
  );
}
