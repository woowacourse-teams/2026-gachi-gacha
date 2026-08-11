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
}

interface Window {
  kakao: typeof kakao;
}
