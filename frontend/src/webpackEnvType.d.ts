declare const __KAKAO_MAP_KEY__: string;
declare const __USE_MSW__: boolean;
declare const __POSTHOG_ENABLED__: boolean;
declare const __POSTHOG_API_KEY__: string;
declare const __POSTHOG_API_HOST__: string;
declare const __APP_ENV__: string;
declare const __APP_VERSION__: string;

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
