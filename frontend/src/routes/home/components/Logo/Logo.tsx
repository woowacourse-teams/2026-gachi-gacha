import styled from '@emotion/styled';

import logoIcon from '@/assets/gacha_logo.png';
import logoWordmark from '@/assets/gachigacha.png';

interface Props {
  compact?: boolean;
}

export default function Logo({ compact = false }: Props) {
  return (
    <Wrapper>
      <Icon src={logoIcon} alt="" $compact={compact} />
      <Wordmark src={logoWordmark} alt="GachiGacha" $compact={compact} />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Icon = styled.img<{ $compact: boolean }>`
  height: ${({ $compact }) => ($compact ? '14px' : '28px')};
`;

const Wordmark = styled.img<{ $compact: boolean }>`
  height: ${({ $compact }) => ($compact ? '13px' : '16px')};
`;
