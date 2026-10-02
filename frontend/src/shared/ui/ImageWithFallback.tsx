import { useState } from 'react';
import type { ImgHTMLAttributes, SyntheticEvent } from 'react';

export interface ImageWithFallbackProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src'
> {
  src: string | null;
}

export function ImageWithFallback({
  src,
  onError,
  ...imageProps
}: ImageWithFallbackProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);

  if (!src || failedSource === src) {
    return null;
  }

  function handleError(event: SyntheticEvent<HTMLImageElement>) {
    setFailedSource(src);
    onError?.(event);
  }

  return <img {...imageProps} src={src} onError={handleError} />;
}
