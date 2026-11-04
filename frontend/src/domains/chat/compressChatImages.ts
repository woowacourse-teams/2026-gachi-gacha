import imageCompression from 'browser-image-compression';

import { captureCoreFeatureFailure } from '@/shared/errorMonitoring/coreFeatureErrorMonitoring';

const WEBP_MIME_TYPE = 'image/webp';
const PNG_MIME_TYPE = 'image/png';
const MAX_COMPRESSED_SIZE_MB = 1;
const MAX_WIDTH_OR_HEIGHT = 1440;
const INITIAL_QUALITY = 0.82;
const WORKER_LIBRARY_URL = '/assets/workers/browser-image-compression.js';

export const CHAT_IMAGE_COMPRESSION_ERROR_MESSAGE =
  '사진을 최적화하지 못했어요. 다른 사진을 선택하거나 크롬 브라우저에서 다시 시도해주세요.';

function createFileName(fileName: string, extension: string): string {
  const extensionStartIndex = fileName.lastIndexOf('.');
  const baseName =
    extensionStartIndex > 0 ? fileName.slice(0, extensionStartIndex) : fileName;

  return `${baseName}.${extension}`;
}

function toFile(source: File, compressed: Blob, type: string): File {
  const extension = type === WEBP_MIME_TYPE ? 'webp' : 'png';

  return new File([compressed], createFileName(source.name, extension), {
    type,
    lastModified: source.lastModified,
  });
}

async function compressOne(file: File): Promise<File> {
  try {
    const compressed = await imageCompression(file, {
      fileType: WEBP_MIME_TYPE,
      initialQuality: INITIAL_QUALITY,
      libURL: WORKER_LIBRARY_URL,
      maxSizeMB: MAX_COMPRESSED_SIZE_MB,
      maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
      preserveExif: false,
      useWebWorker: true,
    });

    if ([WEBP_MIME_TYPE, PNG_MIME_TYPE].includes(compressed.type)) {
      return toFile(file, compressed, compressed.type);
    }
  } catch {
    // Safari의 Web Worker/WebP 변환 실패 시 메인 스레드 PNG 변환을 한 번 더 시도합니다.
  }

  const compressed = await imageCompression(file, {
    fileType: PNG_MIME_TYPE,
    libURL: WORKER_LIBRARY_URL,
    maxSizeMB: MAX_COMPRESSED_SIZE_MB,
    maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
    preserveExif: false,
    useWebWorker: false,
  });

  if (compressed.type !== PNG_MIME_TYPE) {
    throw new Error('지원하는 이미지 형식으로 변환하지 못했습니다.');
  }

  return toFile(file, compressed, PNG_MIME_TYPE);
}

/** 모바일 브라우저의 Canvas 메모리 급증을 피하기 위해 한 장씩 처리합니다. */
export async function compressChatImages(files: File[]): Promise<File[]> {
  const compressedFiles: File[] = [];

  try {
    for (const file of files) {
      compressedFiles.push(await compressOne(file));
    }

    return compressedFiles;
  } catch (error: unknown) {
    captureCoreFeatureFailure('chat_image_compression');
    throw new Error(CHAT_IMAGE_COMPRESSION_ERROR_MESSAGE, { cause: error });
  }
}
