import { useId, type ReactNode } from 'react';

import type { StoreDetailResponseDto } from '@/routes/stores.$storeId/api/storeDetailResponseType';

import { StoreInfoIcon, type StoreInfoIconName } from './StoreInfoIcon';
import {
  InfoContent,
  InfoIcon,
  InfoItem,
  InfoLabel,
  InfoLink,
  InfoList,
  InfoValue,
  Section,
  SectionTitle,
} from './StoreVisitInfo.styles';

interface StoreVisitInfoProps {
  store: Pick<
    StoreDetailResponseDto,
    'businessHours' | 'phoneNumber' | 'instagramId' | 'updatedAt'
  >;
}

interface VisitInfoItem {
  id: string;
  icon: StoreInfoIconName;
  label: string;
  value: ReactNode;
}

const updatedAtFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

function createPhoneUrl(phoneNumber: string): string | null {
  const normalizedPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');

  return /\d/.test(normalizedPhoneNumber)
    ? `tel:${normalizedPhoneNumber}`
    : null;
}

function createInstagramUrl(instagramId: string): string | null {
  const normalizedInstagramId = instagramId.trim().replace(/^@/, '');

  return /^[a-zA-Z0-9._]+$/.test(normalizedInstagramId)
    ? `https://www.instagram.com/${normalizedInstagramId}`
    : null;
}

function formatUpdatedAt(updatedAt: string): string | null {
  const date = new Date(updatedAt);

  return Number.isNaN(date.getTime()) ? null : updatedAtFormatter.format(date);
}

export function StoreVisitInfo({ store }: StoreVisitInfoProps) {
  const titleId = useId();
  const items: VisitInfoItem[] = [];
  const businessHours = store.businessHours?.trim();
  const phoneNumber = store.phoneNumber?.trim();
  const instagramId = store.instagramId?.trim();
  const updatedAt = formatUpdatedAt(store.updatedAt);

  if (businessHours) {
    items.push({
      id: 'business-hours',
      icon: 'clock',
      label: '영업시간',
      value: businessHours,
    });
  }

  if (phoneNumber) {
    const phoneUrl = createPhoneUrl(phoneNumber);

    items.push({
      id: 'phone',
      icon: 'phone',
      label: '전화번호',
      value: phoneUrl ? (
        <InfoLink href={phoneUrl}>{phoneNumber}</InfoLink>
      ) : (
        phoneNumber
      ),
    });
  }

  if (instagramId) {
    const instagramUrl = createInstagramUrl(instagramId);

    items.push({
      id: 'instagram',
      icon: 'instagram',
      label: '인스타그램',
      value: instagramUrl ? (
        <InfoLink href={instagramUrl} target="_blank" rel="noreferrer">
          {instagramId}
        </InfoLink>
      ) : (
        instagramId
      ),
    });
  }

  if (updatedAt) {
    items.push({
      id: 'updated-at',
      icon: 'updated',
      label: '정보 갱신',
      value: updatedAt,
    });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <Section aria-labelledby={titleId}>
      <SectionTitle id={titleId}>방문 정보</SectionTitle>
      <InfoList>
        {items.map(({ icon, id, label, value }) => (
          <InfoItem key={id}>
            <InfoIcon>
              <StoreInfoIcon name={icon} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>{label}</InfoLabel>
              <InfoValue>{value}</InfoValue>
            </InfoContent>
          </InfoItem>
        ))}
      </InfoList>
    </Section>
  );
}
