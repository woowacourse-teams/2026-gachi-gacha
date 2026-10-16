import imageCompression from 'browser-image-compression';

const WEBP_MIME_TYPE = 'image/webp';
const MAX_COMPRESSED_SIZE_MB = 1;
const MAX_WIDTH_OR_HEIGHT = 800;
const INITIAL_QUALITY = 0.8;
const WORKER_LIBRARY_URL = '/assets/workers/browser-image-compression.js';

const IMAGE_FILE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

type SupportedImageMimeType = keyof typeof IMAGE_FILE_EXTENSIONS;

export interface TradeImageCompressionProgress {
  percentage: number;
  completedCount: number;
  totalCount: number;
}

type ProgressListener = (progress: TradeImageCompressionProgress) => void;

function isSupportedImageMimeType(
  mimeType: string,
): mimeType is SupportedImageMimeType {
  return mimeType in IMAGE_FILE_EXTENSIONS;
}

function createCompressedFileName(
  fileName: string,
  mimeType: SupportedImageMimeType,
): string {
  const extensionStartIndex = fileName.lastIndexOf('.');
  const baseName =
    extensionStartIndex > 0 ? fileName.slice(0, extensionStartIndex) : fileName;

  return `${baseName}.${IMAGE_FILE_EXTENSIONS[mimeType]}`;
}

function createCompressedFile(sourceFile: File, compressedBlob: Blob): File {
  if (!isSupportedImageMimeType(compressedBlob.type)) {
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

async function compressImage(
  file: File,
  onProgress: (progress: number) => void,
): Promise<File> {
  try {
    const compressedBlob = await imageCompression(file, {
      fileType: WEBP_MIME_TYPE,
      initialQuality: INITIAL_QUALITY,
      libURL: WORKER_LIBRARY_URL,
      maxSizeMB: MAX_COMPRESSED_SIZE_MB,
      maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
      preserveExif: false,
      useWebWorker: true,
      onProgress,
    });

    // Safari는 OffscreenCanvas에서 WebP를 지원하지 않을 때 PNG로 폴백할 수 있다.
    // 실제로 생성된 안전한 이미지 형식을 존중해 게시글 등록을 계속한다.
    return createCompressedFile(file, compressedBlob);
  } catch {
    try {
      const compressedBlob = await imageCompression(file, {
        fileType: file.type,
        initialQuality: INITIAL_QUALITY,
        maxSizeMB: MAX_COMPRESSED_SIZE_MB,
        maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
        preserveExif: false,
        useWebWorker: false,
        onProgress,
      });

      return createCompressedFile(file, compressedBlob);
    } catch {
      // 사진 선택 단계에서 형식과 용량을 이미 검증했다. 최적화에 실패하더라도
      // 원본을 사용해 게시글 등록이라는 핵심 동작은 막지 않는다.
      return file;
    }
  }
}

/** 선택 순서를 유지하고 iOS의 제한된 캔버스 메모리를 보호하기 위해 순차 압축한다. */
export async function compressTradeImages(
  files: File[],
  onProgress: ProgressListener = () => undefined,
): Promise<File[]> {
  if (files.length === 0) {
    return [];
  }

  const imageProgresses = new Array<number>(files.length).fill(0);
  let completedCount = 0;

  function reportProgress() {
    const percentage = Math.round(
      imageProgresses.reduce((total, progress) => total + progress, 0) /
        files.length,
    );

    onProgress({ percentage, completedCount, totalCount: files.length });
  }

  const results: File[] = [];

  for (const [imageIndex, file] of files.entries()) {
    const compressedFile = await compressImage(file, (progress) => {
      // 라이브러리가 인코딩 완료 직전에 100을 알릴 수 있어 실제 완료 전에는 99로 제한한다.
      imageProgresses[imageIndex] = Math.max(
        imageProgresses[imageIndex] ?? 0,
        Math.min(99, Math.round(progress)),
      );
      reportProgress();
    });

    results.push(compressedFile);
    imageProgresses[imageIndex] = 100;
    completedCount += 1;
    reportProgress();
  }

  return results;
}
