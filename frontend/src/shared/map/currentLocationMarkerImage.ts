export const CURRENT_LOCATION_MARKER_SIZE = 42;

const currentLocationMarkerSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">
    <circle cx="21" cy="21" r="20" fill="#367de8" fill-opacity="0.16" />
    <circle cx="21" cy="21" r="11" fill="#ffffff" />
    <circle cx="21" cy="21" r="7" fill="#367de8" />
    <circle cx="18.5" cy="18.5" r="2" fill="#ffffff" fill-opacity="0.68" />
  </svg>
`;

export const CURRENT_LOCATION_MARKER_IMAGE_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(currentLocationMarkerSvg)}`;
