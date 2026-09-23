import styled from '@emotion/styled';

import logoIcon from '@/assets/gacha_logo.png';
import logoWordmark from '@/assets/gachigacha.png';

export default function Logo() {
  return (
    <Wrapper>
      <Icon src={logoIcon} alt="" />
      <Wordmark src={logoWordmark} alt="GachiGacha" />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Icon = styled.img`
  height: 28px;
`;

const Wordmark = styled.img`
  height: 16px;
`;
