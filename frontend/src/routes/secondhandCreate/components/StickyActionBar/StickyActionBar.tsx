import styled from '@emotion/styled';

export default function StickyActionBar() {
  return (
    <Wrapper>
      <Actions>
        <DraftButton type="button">임시저장</DraftButton>
        <SubmitButton type="submit" form="secondhand-create-form">
          등록하기
        </SubmitButton>
      </Actions>
    </Wrapper>
  );
}

const Wrapper = styled.footer`
  position: fixed;
  z-index: 10;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 16px 24px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  border-top: 1px solid #e9e9ec;
  background: rgb(255 255 255 / 94%);
  box-shadow: 0 -8px 24px rgb(27 28 32 / 6%);
  backdrop-filter: blur(12px);
`;

const Actions = styled.div`
  display: grid;
  width: min(100%, 960px);
  margin: 0 auto;
  grid-template-columns: minmax(120px, 1fr) minmax(180px, 2fr);
  gap: 12px;
`;

const ActionButton = styled.button`
  min-height: 52px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
`;

const DraftButton = styled(ActionButton)`
  border: 1px solid #dcdce1;
  background: #ffffff;
  color: #484a52;
`;

const SubmitButton = styled(ActionButton)`
  border: 1px solid #ed174c;
  background: #ed174c;
  color: #ffffff;
`;
