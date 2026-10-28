import { ControlGroup, ZoomButton, ZoomIcon } from './MapZoomControls.styles';

export interface MapZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function MapZoomControls({ onZoomIn, onZoomOut }: MapZoomControlsProps) {
  return (
    <ControlGroup role="group" aria-label="지도 확대 및 축소">
      <ZoomButton
        type="button"
        aria-label="지도 확대"
        title="지도 확대"
        onClick={onZoomIn}
      >
        <ZoomIcon viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </ZoomIcon>
      </ZoomButton>
      <ZoomButton
        type="button"
        aria-label="지도 축소"
        title="지도 축소"
        onClick={onZoomOut}
      >
        <ZoomIcon viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 12h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </ZoomIcon>
      </ZoomButton>
    </ControlGroup>
  );
}
