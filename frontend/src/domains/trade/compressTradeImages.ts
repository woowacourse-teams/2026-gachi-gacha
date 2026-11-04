import imageCompression from 'browser-image-compression';

import { captureCoreFeatureFailure } from '@/shared/errorMonitoring/coreFeatureErrorMonitoring';

const WEBP_MIME_TYPE = 'image/webp';
const JPEG_MIME_TYPE = 'image/jpeg';
const MAX_COMPRESSED_SIZE_MB = 1;
const MAX_WIDTH_OR_HEIGHT = 800;
const INITIAL_QUALITY = 0.8;
const MAX_CONCURRENT_COMPRESSION_COUNT = 2;

export const TRADE_IMAGE_COMPRESSION_ERROR_MESSAGE =
  '이미지를 최적화하지 못했습니다. 다시 시도해 주세요.';

const IMAGE_FILE_EXTENSIONS = {
  [WEBP_MIME_TYPE]: 'webp',
  [JPEG_MIME_TYPE]: 'jpg',
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

/** WASM WebP → JPEG 순서로 압축한다. */
async function compressImage(
  file: File,
  options: Parameters<typeof imageCompression>[1],
): Promise<File> {
  try {
    const { encodeTradeImageWithWasm } =
      await import('./encodeTradeImageWithWasm');
    const webpBlob = await encodeTradeImageWithWasm(file, options.signal);
    return createCompressedFile(file, webpBlob);
  } catch {
    // WASM 로드·디코딩·인코딩 오류는 JPEG 폴백에서 처리한다.
  }

  const jpegBlob = await imageCompression(file, {
    ...options,
    fileType: JPEG_MIME_TYPE,
  });

  return createCompressedFile(file, jpegBlob);
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
