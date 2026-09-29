import {
  ErrorCard,
  ErrorDescription,
  ErrorScreen,
  ErrorTitle,
  ReloadButton,
} from './AppErrorFallback.styles';

export interface AppErrorFallbackProps {
  onReload?: () => void;
}

export function AppErrorFallback({
  onReload = () => window.location.reload(),
}: AppErrorFallbackProps) {
  return (
    <ErrorScreen>
      <ErrorCard role="alert" aria-live="assertive">
        <ErrorTitle>문제가 발생했어요</ErrorTitle>
        <ErrorDescription>
          일시적인 오류일 수 있어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.
        </ErrorDescription>
        <ReloadButton type="button" onClick={onReload}>
          새로고침
        </ReloadButton>
      </ErrorCard>
    </ErrorScreen>
  );
}
