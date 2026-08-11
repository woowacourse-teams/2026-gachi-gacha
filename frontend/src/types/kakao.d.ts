declare namespace kakao.maps {
  function load(callback: () => void): void;

  class LatLng {
    constructor(latitude: number, longitude: number);
  }

  interface MapOptions {
    center: LatLng;
    level?: number;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
  }

  interface CustomOverlayOptions {
    clickable?: boolean;
    content: HTMLElement;
    position: LatLng;
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
  }
}

interface Window {
  kakao: typeof kakao;
}
