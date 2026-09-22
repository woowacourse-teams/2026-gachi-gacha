export const CURRENT_LOCATION_MARKER_SIZE = 42;

const currentLocationMarkerSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">
    <defs>
      <radialGradient id="location-aura" cx="50%" cy="50%" r="50%">
        <stop offset="38%" stop-color="#ffffff" stop-opacity="1" />
        <stop offset="66%" stop-color="#ffffff" stop-opacity="0.94" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="location-core" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#367de8" />
        <stop offset="52%" stop-color="#367de8" stop-opacity="0.98" />
        <stop offset="78%" stop-color="#5c94ea" stop-opacity="0.76" />
        <stop offset="100%" stop-color="#8ab4f3" stop-opacity="0.08" />
      </radialGradient>
    </defs>
    <circle cx="21" cy="21" r="20" fill="#367de8" fill-opacity="0.16" />
    <circle cx="21" cy="21" r="15" fill="url(#location-aura)" />
    <circle cx="21" cy="21" r="9" fill="url(#location-core)" />
  </svg>
`;

export const CURRENT_LOCATION_MARKER_IMAGE_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(currentLocationMarkerSvg)}`;
