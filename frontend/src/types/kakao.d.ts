/// <reference types="kakao.maps.d.ts" />

declare namespace kakao.maps {
  function load(callback: () => void): void;
}

interface Window {
  kakao: typeof kakao;
}
