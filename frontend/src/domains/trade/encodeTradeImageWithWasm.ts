const WEBP_MIME_TYPE = 'image/webp';
const MAX_DIMENSION = 800;
const MAX_SIZE_BYTES = 1024 * 1024;
const WEBP_QUALITIES = [80, 65, 50, 35] as const;

async function readImageData(
  file: File,
  signal?: AbortSignal,
): Promise<ImageData> {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        image.onload = null;
        image.onerror = null;
        signal?.removeEventListener('abort', abort);
      };
      const abort = () => {
        cleanup();
        reject(signal?.reason ?? new Error('이미지 처리가 중단되었습니다.'));
      };

      image.onload = () => {
        cleanup();
        resolve();
      };
      image.onerror = () => {
        cleanup();
        reject(new Error('이미지를 디코딩하지 못했습니다.'));
      };
      signal?.addEventListener('abort', abort, { once: true });

      if (signal?.aborted) {
        abort();
        return;
      }

      image.src = objectUrl;
    });

    if (image.naturalWidth === 0 || image.naturalHeight === 0) {
      throw new Error('이미지 크기를 확인하지 못했습니다.');
    }

    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('이미지 캔버스를 생성하지 못했습니다.');
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return context.getImageData(0, 0, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Canvas는 픽셀 추출에만 사용하고 WebP 인코딩은 WASM libwebp에 맡긴다. */
export async function encodeTradeImageWithWasm(
  file: File,
  signal?: AbortSignal,
): Promise<Blob> {
  const [encoder, imageData] = await Promise.all([
    import('@jsquash/webp/encode'),
    readImageData(file, signal),
  ]);

  for (const quality of WEBP_QUALITIES) {
    if (signal?.aborted) {
      throw signal.reason ?? new Error('이미지 처리가 중단되었습니다.');
    }
    const buffer = await encoder.default(imageData, { quality });
    const blob = new Blob([buffer], { type: WEBP_MIME_TYPE });

    if (blob.size <= MAX_SIZE_BYTES) {
      return blob;
    }
  }

  throw new Error('WebP 압축 결과가 최대 크기를 초과했습니다.');
}
