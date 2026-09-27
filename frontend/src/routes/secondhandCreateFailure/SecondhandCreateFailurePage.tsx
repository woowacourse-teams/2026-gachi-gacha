import styled from '@emotion/styled';

interface SecondhandCreateFailurePageProps {
  errorMessage: string;
  onRetry: () => void;
  onMoveToFeed: () => void;
}

export default function SecondhandCreateFailurePage({
  errorMessage,
  onRetry,
  onMoveToFeed,
}: SecondhandCreateFailurePageProps) {
  return (
    <Page>
      <Content>
        <FailureIcon aria-hidden="true">!</FailureIcon>

        <Title>교환 글을 등록하지 못했어요</Title>
        <Description>
          일시적인 문제로 등록을 완료하지 못했습니다.
          <br />
          잠시 후 다시 시도해주세요.
        </Description>

        <ErrorBox role="alert">
          <ErrorLabel>등록 실패 사유</ErrorLabel>
          <ErrorMessage>{errorMessage}</ErrorMessage>
        </ErrorBox>

        <Actions>
          <PrimaryButton type="button" onClick={onRetry}>
            다시 등록하기
          </PrimaryButton>
          <SecondaryButton type="button" onClick={onMoveToFeed}>
            동네 피드로 이동
          </SecondaryButton>
        </Actions>
      </Content>
    </Page>
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

const FailureIcon = styled.div`
  display: grid;
  width: 78px;
  height: 78px;
  margin-bottom: 30px;
  place-items: center;
  border-radius: 50%;
  background: #fff0f3;
  color: #ed174c;
  font-size: 42px;
  font-weight: 500;
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

const ErrorBox = styled.div`
  box-sizing: border-box;
  width: 100%;
  padding: 20px;
  border: 1px solid #f1d9df;
  border-radius: 16px;
  background: #fffafb;
  text-align: left;
`;

const ErrorLabel = styled.p`
  margin: 0 0 8px;
  color: #8e4658;
  font-size: 13px;
  font-weight: 800;
`;

const ErrorMessage = styled.p`
  margin: 0;
  color: #686a73;
  font-size: 14px;
  line-height: 1.6;
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
  min-width: 150px;
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
