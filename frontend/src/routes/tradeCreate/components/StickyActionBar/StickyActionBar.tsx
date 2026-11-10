import styled from '@emotion/styled';
import { Link } from 'react-router';

interface StickyActionBarProps {
  isSubmitting: boolean;
  formId?: string;
  cancelTo: string;
  submitLabel?: string;
  submittingLabel?: string;
  disabled?: boolean;
}

export default function StickyActionBar({
  isSubmitting,
  formId = 'trade-create-form',
  cancelTo,
  submitLabel = '등록하기',
  submittingLabel = '등록 중...',
  disabled = false,
}: StickyActionBarProps) {
  return (
    <Wrapper>
      <Actions>
        <CancelLink to={cancelTo}>취소</CancelLink>
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
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  border-top: 1px solid #e9e9ec;
  background: #fff;
`;

const Actions = styled.div`
  display: flex;
  width: min(100%, 720px);
  margin: 0 auto;
  justify-content: flex-end;
  gap: 12px;
`;

const CancelLink = styled(Link)`
  display: grid;
  box-sizing: border-box;
  width: 120px;
  min-height: 48px;
  place-items: center;
  border: 1px solid #e9e9ec;
  border-radius: 12px;
  color: #202126;
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;

  @media (max-width: 767px) {
    display: none;
  }
`;

const SubmitButton = styled.button`
  width: 160px;
  min-height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;

  @media (max-width: 767px) {
    width: 100%;
  }

  border: 1px solid #ed174c;
  background: #ed174c;
  color: #ffffff;

  &:disabled {
    opacity: 0.65;
    cursor: wait;
  }
`;
