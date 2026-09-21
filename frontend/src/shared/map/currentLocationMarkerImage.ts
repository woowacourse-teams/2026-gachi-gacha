export const CURRENT_LOCATION_MARKER_SIZE = 42;

const currentLocationMarkerSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">
    <defs>
      <radialGradient id="location-ring" cx="50%" cy="50%" r="50%">
        <stop offset="48%" stop-color="#ffffff" stop-opacity="1" />
        <stop offset="68%" stop-color="#ffffff" stop-opacity="0.82" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
      </radialGradient>
    </defs>
    <circle cx="21" cy="21" r="20" fill="#367de8" fill-opacity="0.16" />
    <circle cx="21" cy="21" r="14" fill="url(#location-ring)" />
    <circle cx="21" cy="21" r="7" fill="#367de8" />
  </svg>
`;

export const CURRENT_LOCATION_MARKER_IMAGE_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(currentLocationMarkerSvg)}`;
