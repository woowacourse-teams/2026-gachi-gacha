import { useId } from 'react';

import type { StoreDetailResponseDto } from '@/routes/stores.$storeId/api/storeDetailResponseType';

import {
  AmenityIcon,
  AmenityItem,
  AmenityList,
  Section,
  SectionTitle,
} from './StoreAmenities.styles';
import {
  getStoreFacilityIconName,
  StoreInfoIcon,
  type StoreInfoIconName,
} from './StoreInfoIcon';

interface StoreAmenitiesProps {
  store: Pick<
    StoreDetailResponseDto,
    'facilities' | 'hasRandomBox' | 'hasSelectGacha'
  >;
}

interface Amenity {
  id: string;
  icon: StoreInfoIconName;
  label: string;
}

export function StoreAmenities({ store }: StoreAmenitiesProps) {
  const titleId = useId();
  const facilities = Array.from(
    new Set(
      store.facilities.map((facility) => facility.trim()).filter(Boolean),
    ),
  );
  const amenities: Amenity[] = facilities.map((facility) => ({
    id: `facility-${facility}`,
    icon: getStoreFacilityIconName(facility),
    label: facility,
  }));

  if (store.hasRandomBox) {
    amenities.push({
      id: 'random-box',
      icon: 'randomBox',
      label: '랜덤박스',
    });
  }

  if (store.hasSelectGacha) {
    amenities.push({
      id: 'select-gacha',
      icon: 'selectGacha',
      label: '선택 가챠',
    });
  }

  if (amenities.length === 0) {
    return null;
  }

  return (
    <Section aria-labelledby={titleId}>
      <SectionTitle id={titleId}>편의시설</SectionTitle>
      <AmenityList>
        {amenities.map(({ icon, id, label }) => (
          <AmenityItem key={id}>
            <AmenityIcon>
              <StoreInfoIcon name={icon} />
            </AmenityIcon>
            <span>{label}</span>
          </AmenityItem>
        ))}
      </AmenityList>
    </Section>
  );
}
