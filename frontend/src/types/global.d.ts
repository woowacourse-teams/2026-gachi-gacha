declare const __IS_DEV__: boolean;
declare const __KAKAO_MAP_KEY__: string;

interface GachiPostHogClient {
  capture(eventName: string, properties?: Record<string, unknown>): void;
}

interface Window {
  posthog?: GachiPostHogClient;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
