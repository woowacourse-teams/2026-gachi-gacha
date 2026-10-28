import { Button, Icon } from './CurrentLocationButton.styles';

export interface CurrentLocationButtonProps {
  isLocating?: boolean;
  onLocate: () => void;
}

export function CurrentLocationButton({
  isLocating = false,
  onLocate,
}: CurrentLocationButtonProps) {
  const label = isLocating ? '현재 위치 확인 중' : '현재 위치로 이동';

  return (
    <Button
      type="button"
      aria-label={label}
      aria-busy={isLocating}
      title={label}
      disabled={isLocating}
      onClick={onLocate}
    >
      <Icon
        $isLocating={isLocating}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 2.5V6M12 18v3.5M2.5 12H6M18 12h3.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="1.5" fill="#367de8" />
      </Icon>
    </Button>
  );
}
