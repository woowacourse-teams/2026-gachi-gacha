import imageCompression from 'browser-image-compression';

const WEBP_MIME_TYPE = 'image/webp';
const PNG_MIME_TYPE = 'image/png';
const MAX_COMPRESSED_SIZE_MB = 1;
const MAX_WIDTH_OR_HEIGHT = 800;
const INITIAL_QUALITY = 0.8;
const MAX_CONCURRENT_COMPRESSION_COUNT = 2;

export const TRADE_IMAGE_COMPRESSION_ERROR_MESSAGE =
  '이미지를 최적화하지 못했습니다. 다시 시도해주세요.';

export interface TradeImageCompressionProgress {
  percentage: number;
  completedCount: number;
  totalCount: number;
}

type ProgressListener = (progress: TradeImageCompressionProgress) => void;

type SupportedCompressionMimeType =
  typeof WEBP_MIME_TYPE | typeof PNG_MIME_TYPE;

function createCompressedFileName(
  fileName: string,
  mimeType: SupportedCompressionMimeType,
): string {
  const extensionStartIndex = fileName.lastIndexOf('.');
  const baseName =
    extensionStartIndex > 0 ? fileName.slice(0, extensionStartIndex) : fileName;
  const extension = mimeType === WEBP_MIME_TYPE ? 'webp' : 'png';

  return `${baseName}.${extension}`;
}

/** 선택 순서를 유지하면서 모바일 메모리를 보호하기 위해 최대 두 장씩 압축한다. */
export async function compressTradeImages(
  files: File[],
  onProgress: ProgressListener = () => undefined,
): Promise<File[]> {
  if (files.length === 0) {
    return [];
  }

  const controller = new AbortController();
  const results = new Array<File>(files.length);
  const imageProgresses = new Array<number>(files.length).fill(0);
  let nextImageIndex = 0;
  let completedCount = 0;

  function reportProgress() {
    const percentage = Math.round(
      imageProgresses.reduce((total, progress) => total + progress, 0) /
        files.length,
    );

    onProgress({ percentage, completedCount, totalCount: files.length });
  }

  async function compressNextImage(): Promise<void> {
    while (nextImageIndex < files.length) {
      const imageIndex = nextImageIndex;
      const file = files[imageIndex];

      nextImageIndex += 1;

      if (!file) {
        continue;
      }

      const onImageProgress = (progress: number) => {
        // 라이브러리가 인코딩 완료 직전에 100을 알릴 수 있어 실제 완료 전에는 99로 제한한다.
        imageProgresses[imageIndex] = Math.max(
          imageProgresses[imageIndex] ?? 0,
          Math.min(99, Math.round(progress)),
        );
        reportProgress();
      };

      const compressionOptions = {
        initialQuality: INITIAL_QUALITY,
        maxSizeMB: MAX_COMPRESSED_SIZE_MB,
        maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
        onProgress: onImageProgress,
        preserveExif: false,
        signal: controller.signal,
        useWebWorker: false,
      };

      let compressedBlob: File;

      try {
        compressedBlob = await imageCompression(file, {
          ...compressionOptions,
          fileType: WEBP_MIME_TYPE,
        });
      } catch {
        compressedBlob = await imageCompression(file, {
          ...compressionOptions,
          fileType: PNG_MIME_TYPE,
        });
      }

      if (
        compressedBlob.type !== WEBP_MIME_TYPE &&
        compressedBlob.type !== PNG_MIME_TYPE
      ) {
        compressedBlob = await imageCompression(file, {
          ...compressionOptions,
          fileType: PNG_MIME_TYPE,
        });
      }

      if (
        compressedBlob.type !== WEBP_MIME_TYPE &&
        compressedBlob.type !== PNG_MIME_TYPE
      ) {
        throw new Error(
          '이 브라우저에서는 WebP와 PNG 변환을 지원하지 않습니다.',
        );
      }

      const outputMimeType = compressedBlob.type;

      results[imageIndex] = new File(
        [compressedBlob],
        createCompressedFileName(file.name, outputMimeType),
        {
          type: outputMimeType,
          lastModified: file.lastModified,
        },
      );
      imageProgresses[imageIndex] = 100;
      completedCount += 1;
      reportProgress();
    }
  }

  const compressionWorkerCount = Math.min(
    MAX_CONCURRENT_COMPRESSION_COUNT,
    files.length,
  );

  try {
    await Promise.all(
      Array.from({ length: compressionWorkerCount }, () => compressNextImage()),
    );

    return results;
  } catch (error: unknown) {
    if (__APP_ENV__ === 'development') {
      console.error(
        '교환 글 이미지 압축 실패',
        files.map((file) => ({ type: file.type, size: file.size })),
        error,
      );
    }

    controller.abort(error);
    throw new Error(TRADE_IMAGE_COMPRESSION_ERROR_MESSAGE, { cause: error });
  }
}
