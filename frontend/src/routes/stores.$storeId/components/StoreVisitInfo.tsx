import { useId, type ReactNode } from 'react';

import type { StoreDetailResponseDto } from '@/routes/stores.$storeId/api/storeDetailResponseType';

import {
  InfoContent,
  InfoLabel,
  InfoLink,
  InfoList,
  InfoValue,
  Section,
  SectionTitle,
  Updated,
} from './StoreVisitInfo.styles';

interface StoreVisitInfoProps {
  store: Pick<
    StoreDetailResponseDto,
    | 'businessHours'
    | 'phoneNumber'
    | 'instagramId'
    | 'paymentMethods'
    | 'gachaMachineAmount'
    | 'kujiAmount'
    | 'facilities'
    | 'hasRandomBox'
    | 'hasSelectGacha'
  >;
}

interface VisitInfoItem {
  id: string;
  label: string;
  value: ReactNode;
}

const updatedAtFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
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

  if (businessHours) {
    items.push({
      id: 'business-hours',
      label: '영업시간',
      value: businessHours,
    });
  }

  const payment = Array.from(
    new Set(
      store.paymentMethods
        ?.split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).join(' · ');
  if (payment) items.push({ id: 'payment', label: '결제', value: payment });
  const operations = [
    store.gachaMachineAmount && store.gachaMachineAmount > 0
      ? `가챠 ${store.gachaMachineAmount.toLocaleString('ko-KR')}대`
      : null,
    store.kujiAmount && store.kujiAmount > 0
      ? `쿠지 ${store.kujiAmount.toLocaleString('ko-KR')}개`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');
  if (operations)
    items.push({ id: 'operations', label: '운영', value: operations });
  const facilities = Array.from(
    new Set([
      ...store.facilities.map((value) => value.trim()).filter(Boolean),
      ...(store.hasRandomBox ? ['랜덤박스'] : []),
      ...(store.hasSelectGacha ? ['선택 가챠'] : []),
    ]),
  );
  if (facilities.length)
    items.push({
      id: 'facilities',
      label: '편의시설',
      value: facilities.join(', '),
    });

  if (phoneNumber) {
    const phoneUrl = createPhoneUrl(phoneNumber);

    items.push({
      id: 'phone',
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

  if (items.length === 0) {
    return null;
  }

  return (
    <Section aria-labelledby={titleId}>
      <SectionTitle id={titleId}>방문 정보</SectionTitle>
      <InfoList>
        {items.map(({ id, label, value }) => (
          <InfoContent key={id}>
            <InfoLabel>{label}</InfoLabel>
            <InfoValue>{value}</InfoValue>
          </InfoContent>
        ))}
      </InfoList>
    </Section>
  );
}

export function StoreUpdatedAt({ updatedAt }: { updatedAt: string }) {
  const value = formatUpdatedAt(updatedAt);
  return value ? <Updated>정보 갱신 {value}</Updated> : null;
}
