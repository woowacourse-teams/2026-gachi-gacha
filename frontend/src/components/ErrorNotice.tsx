import styled from '@emotion/styled';

interface ErrorNoticeProps {
  message: string;
  onRetry: () => void;
  className?: string;
}

export default function ErrorNotice({
  message,
  onRetry,
  className,
}: ErrorNoticeProps) {
  return (
    <Notice role="alert" className={className}>
      <Message>{message}</Message>
      <RetryButton type="button" onClick={onRetry}>
        다시 시도
      </RetryButton>
    </Notice>
  );
}

const Notice = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Message = styled.p`
  margin: 0;
`;

const RetryButton = styled.button`
  flex: none;
  padding: 5px 12px;
  border: 1px solid currentColor;
  border-radius: 999px;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
`;
