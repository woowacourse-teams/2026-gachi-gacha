declare const __KAKAO_MAP_KEY__: string;
declare const __USE_MSW__: boolean;

declare module '*.png' {
  const source: string;

  export default source;
}

declare module '*.jpg' {
  const source: string;

  export default source;
}

declare module '*.webp' {
  const source: string;

  export default source;
}
