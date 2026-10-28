import imageCompression from 'browser-image-compression';

import { captureCoreFeatureFailure } from '@/shared/errorMonitoring/coreFeatureErrorMonitoring';

const WEBP_MIME_TYPE = 'image/webp';
const PNG_MIME_TYPE = 'image/png';
const MAX_COMPRESSED_SIZE_MB = 1;
const MAX_WIDTH_OR_HEIGHT = 800;
const INITIAL_QUALITY = 0.8;
const MAX_CONCURRENT_COMPRESSION_COUNT = 2;

export const TRADE_IMAGE_COMPRESSION_ERROR_MESSAGE =
  '이미지를 최적화하지 못했습니다. Chrome 브라우저에서 다시 시도해 주세요.';

const IMAGE_FILE_EXTENSIONS = {
  [WEBP_MIME_TYPE]: 'webp',
  [PNG_MIME_TYPE]: 'png',
} as const;

type SupportedCompressionMimeType = keyof typeof IMAGE_FILE_EXTENSIONS;

export interface TradeImageCompressionProgress {
  percentage: number;
  completedCount: number;
  totalCount: number;
}

type ProgressListener = (progress: TradeImageCompressionProgress) => void;

function isSupportedCompressionMimeType(
  mimeType: string,
): mimeType is SupportedCompressionMimeType {
  return mimeType in IMAGE_FILE_EXTENSIONS;
}

function createCompressedFileName(
  fileName: string,
  mimeType: SupportedCompressionMimeType,
): string {
  const extensionStartIndex = fileName.lastIndexOf('.');
  const baseName =
    extensionStartIndex > 0 ? fileName.slice(0, extensionStartIndex) : fileName;

  return `${baseName}.${IMAGE_FILE_EXTENSIONS[mimeType]}`;
}

function createCompressedFile(sourceFile: File, compressedBlob: Blob): File {
  if (!isSupportedCompressionMimeType(compressedBlob.type)) {
    throw new Error(`지원하지 않는 압축 결과 형식: ${compressedBlob.type}`);
  }

  return new File(
    [compressedBlob],
    createCompressedFileName(sourceFile.name, compressedBlob.type),
    {
      type: compressedBlob.type,
      lastModified: sourceFile.lastModified,
    },
  );
}

/** WebP를 우선 사용하고 브라우저가 인코딩하지 못하면 PNG로 한 번만 폴백한다. */
async function compressImage(
  file: File,
  options: Parameters<typeof imageCompression>[1],
): Promise<File> {
  try {
    const webpBlob = await imageCompression(file, {
      ...options,
      fileType: WEBP_MIME_TYPE,
    });

    // 일부 Safari는 WebP를 요청해도 PNG를 반환한다. 실제 안전한 형식을 존중한다.
    if (isSupportedCompressionMimeType(webpBlob.type)) {
      return createCompressedFile(file, webpBlob);
    }
  } catch {
    // WebP 예외도 아래 PNG 폴백에서 동일하게 처리한다.
  }

  const pngBlob = await imageCompression(file, {
    ...options,
    fileType: PNG_MIME_TYPE,
  });

  return createCompressedFile(file, pngBlob);
}

/** 선택 순서를 유지하면서 대기 시간을 줄이기 위해 최대 두 장씩 압축한다. */
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

      const compressedFile = await compressImage(file, {
        initialQuality: INITIAL_QUALITY,
        maxSizeMB: MAX_COMPRESSED_SIZE_MB,
        maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
        onProgress: (progress) => {
          // 라이브러리가 인코딩 완료 직전에 100을 알릴 수 있어 실제 완료 전에는 99로 제한한다.
          imageProgresses[imageIndex] = Math.max(
            imageProgresses[imageIndex] ?? 0,
            Math.min(99, Math.round(progress)),
          );
          reportProgress();
        },
        preserveExif: false,
        signal: controller.signal,
        useWebWorker: false,
      });

      results[imageIndex] = compressedFile;
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
    captureCoreFeatureFailure('trade_image_compression');

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
