import styled from '@emotion/styled';

interface StickyActionBarProps {
  isSubmitting: boolean;
  formId?: string;
  submitLabel?: string;
  submittingLabel?: string;
  disabled?: boolean;
}

export default function StickyActionBar({
  isSubmitting,
  formId = 'trade-create-form',
  submitLabel = '등록하기',
  submittingLabel = '등록 중...',
  disabled = false,
}: StickyActionBarProps) {
  return (
    <Wrapper>
      <Actions>
        <SubmitButton
          type="submit"
          form={formId}
          disabled={disabled || isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? submittingLabel : submitLabel}
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
  grid-template-columns: 1fr;
`;

const ActionButton = styled.button`
  min-height: 52px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
`;

const SubmitButton = styled(ActionButton)`
  border: 1px solid #ed174c;
  background: #ed174c;
  color: #ffffff;

  &:disabled {
    opacity: 0.65;
    cursor: wait;
  }
`;
