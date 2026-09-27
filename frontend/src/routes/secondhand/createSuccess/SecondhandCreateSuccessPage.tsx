import styled from '@emotion/styled';

import CreatedTradeSummary from './components/CreatedTradeSummary';
import type { CreatedTrade } from './model/createdTrade';

interface SecondhandCreateSuccessPageProps {
  trade: CreatedTrade;
  onViewTrade: () => void;
  onMoveToFeed: () => void;
}

export default function SecondhandCreateSuccessPage({
  trade,
  onViewTrade,
  onMoveToFeed,
}: SecondhandCreateSuccessPageProps) {
  return (
    <Page>
      <Content>
        <SuccessIcon aria-hidden="true">
          <CheckIcon />
        </SuccessIcon>

        <Title>교환 글이 등록됐어요</Title>
        <Description>
          {trade.place} 주변 피드에 바로 노출됩니다.
          <br />
          채팅이 오면 알림으로 알려드릴게요.
        </Description>

        <SummaryWrapper>
          <CreatedTradeSummary trade={trade} />
        </SummaryWrapper>

        <Actions>
          <PrimaryButton type="button" onClick={onViewTrade}>
            내 글 보기
          </PrimaryButton>
          <SecondaryButton type="button" onClick={onMoveToFeed}>
            동네 피드로 이동
          </SecondaryButton>
        </Actions>
      </Content>
    </Page>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="38" height="38" fill="none">
      <path
        d="m6 12.5 4 4L18.5 8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const Page = styled.main`
  display: grid;
  box-sizing: border-box;
  min-height: 100dvh;
  padding: 72px 24px;
  place-items: start center;
  background: #ffffff;

  @media (max-width: 560px) {
    padding: 52px 16px;
  }
`;

const Content = styled.div`
  display: flex;
  width: min(100%, 580px);
  margin-top: clamp(16px, 7vh, 88px);
  align-items: center;
  flex-direction: column;
  text-align: center;
`;

const SuccessIcon = styled.div`
  display: grid;
  width: 78px;
  height: 78px;
  margin-bottom: 30px;
  place-items: center;
  border-radius: 50%;
  background: #ed174c;
  color: #ffffff;
`;

const Title = styled.h1`
  margin: 0;
  color: #24252a;
  font-size: clamp(28px, 3vw, 38px);
  font-weight: 800;
  letter-spacing: -0.04em;
`;

const Description = styled.p`
  margin: 22px 0 28px;
  color: #7d7f88;
  font-size: 15px;
  line-height: 1.7;
`;

const SummaryWrapper = styled.div`
  width: 100%;
`;

const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 24px;

  @media (max-width: 420px) {
    width: 100%;
    flex-direction: column;
  }
`;

const ActionButton = styled.button`
  min-width: 140px;
  min-height: 50px;
  padding: 0 22px;
  border-radius: 11px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
`;

const PrimaryButton = styled(ActionButton)`
  border: 1px solid #ed174c;
  background: #ed174c;
  color: #ffffff;
`;

const SecondaryButton = styled(ActionButton)`
  border: 1px solid #f3f3f4;
  background: #f6f6f7;
  color: #686a73;
`;
