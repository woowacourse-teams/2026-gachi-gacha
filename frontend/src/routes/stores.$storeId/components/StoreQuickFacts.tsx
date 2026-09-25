import { useId } from 'react';

import type { StoreDetailResponseDto } from '@/routes/stores.$storeId/api/storeDetailResponseType';

import {
  getStoreFacilityIconName,
  StoreInfoIcon,
  type StoreInfoIconName,
} from './StoreInfoIcon';
import {
  FactCard,
  FactIcon,
  FactList,
  FactText,
  Section,
  SectionTitle,
} from './StoreQuickFacts.styles';

interface StoreQuickFactsProps {
  store: Pick<
    StoreDetailResponseDto,
    'gachaMachineAmount' | 'kujiAmount' | 'paymentMethods' | 'facilities'
  >;
}

interface StoreFact {
  id: string;
  icon: StoreInfoIconName;
  text: string;
}

const numberFormatter = new Intl.NumberFormat('ko-KR');

function createPaymentSummary(paymentMethods: string | null): string | null {
  if (!paymentMethods?.trim()) {
    return null;
  }

  const methods = Array.from(
    new Set(
      paymentMethods
        .split(',')
        .map((method) => method.trim())
        .filter(Boolean),
    ),
  );

  return methods.length > 0 ? `${methods.join(' · ')} 결제` : null;
}

export function StoreQuickFacts({ store }: StoreQuickFactsProps) {
  const titleId = useId();
  const facts: StoreFact[] = [];

  if (store.gachaMachineAmount !== null && store.gachaMachineAmount > 0) {
    facts.push({
      id: 'gacha-machine',
      icon: 'gacha',
      text: `가챠 ${numberFormatter.format(store.gachaMachineAmount)}대 운영`,
    });
  }

  if (store.kujiAmount !== null && store.kujiAmount > 0) {
    facts.push({
      id: 'kuji',
      icon: 'kuji',
      text: `쿠지 ${numberFormatter.format(store.kujiAmount)}개 운영`,
    });
  }

  const paymentSummary = createPaymentSummary(store.paymentMethods);

  if (paymentSummary) {
    facts.push({
      id: 'payment',
      icon: 'payment',
      text: paymentSummary,
    });
  }

  const primaryFacility = store.facilities.find((facility) => facility.trim());

  if (primaryFacility) {
    facts.push({
      id: 'primary-facility',
      icon: getStoreFacilityIconName(primaryFacility),
      text: primaryFacility.trim(),
    });
  }

  if (facts.length === 0) {
    return null;
  }

  return (
    <Section aria-labelledby={titleId}>
      <SectionTitle id={titleId}>매장 정보</SectionTitle>
      <FactList>
        {facts.map(({ icon, id, text }) => (
          <FactCard key={id}>
            <FactIcon>
              <StoreInfoIcon name={icon} />
            </FactIcon>
            <FactText>{text}</FactText>
          </FactCard>
        ))}
      </FactList>
    </Section>
  );
}
