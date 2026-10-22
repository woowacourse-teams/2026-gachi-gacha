// Re-export the native module. On web, it will be resolved to GachiKakaoMapModule.web.ts
// and on native platforms to GachiKakaoMapModule.ts
export { default } from './src/GachiKakaoMapModule';
export { default as GachiKakaoMapView } from './src/GachiKakaoMapView';
export * from './src/GachiKakaoMap.types';
