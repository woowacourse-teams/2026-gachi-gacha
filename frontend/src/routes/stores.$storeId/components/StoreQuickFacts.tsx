import { useId } from 'react';

import type { StoreDetailResponseDto } from '@/routes/stores.$storeId/api/storeDetailResponseType';

import {
  FactCard,
  FactLabel,
  FactList,
  FactValue,
  Section,
  SectionTitle,
} from './StoreQuickFacts.styles';

interface StoreQuickFactsProps {
  store: Pick<
    StoreDetailResponseDto,
    'gachaMachineAmount' | 'kujiAmount' | 'hasRandomBox' | 'hasSelectGacha'
  >;
}

interface StoreFact {
  label: string;
  value: string;
  isPending: boolean;
}

const numberFormatter = new Intl.NumberFormat('ko-KR');

function formatAmount(amount: number | null, unit: string): StoreFact['value'] {
  if (amount === null) {
    return '정보 준비 중';
  }

  if (amount <= 0) {
    return '없음';
  }

  return `${numberFormatter.format(amount)}${unit}`;
}

function formatAvailability(isAvailable: boolean | null) {
  if (isAvailable === null) {
    return '정보 준비 중';
  }

  return isAvailable ? '취급' : '미취급';
}

export function StoreQuickFacts({ store }: StoreQuickFactsProps) {
  const titleId = useId();
  const facts: readonly StoreFact[] = [
    {
      label: '가챠 기계',
      value: formatAmount(store.gachaMachineAmount, '대'),
      isPending: store.gachaMachineAmount === null,
    },
    {
      label: '쿠지',
      value: formatAmount(store.kujiAmount, '개'),
      isPending: store.kujiAmount === null,
    },
    {
      label: '랜덤박스',
      value: formatAvailability(store.hasRandomBox),
      isPending: false,
    },
    {
      label: '선택 가챠',
      value: formatAvailability(store.hasSelectGacha),
      isPending: store.hasSelectGacha === null,
    },
  ];

  return (
    <Section aria-labelledby={titleId}>
      <SectionTitle id={titleId}>매장 정보</SectionTitle>
      <FactList>
        {facts.map(({ isPending, label, value }) => (
          <FactCard key={label}>
            <FactLabel>{label}</FactLabel>
            <FactValue $isPending={isPending}>{value}</FactValue>
          </FactCard>
        ))}
      </FactList>
    </Section>
  );
}
