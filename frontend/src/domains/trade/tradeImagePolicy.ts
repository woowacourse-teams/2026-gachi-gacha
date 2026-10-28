const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

// 백엔드 multipart max-file-size와 맞춘다.
export const MAX_TRADE_IMAGE_SIZE_MB = 10;
const MAX_TRADE_IMAGE_SIZE_BYTES = MAX_TRADE_IMAGE_SIZE_MB * 1024 * 1024;

/** 파일 선택창에서 정적 이미지만 고를 수 있도록 MIME 타입과 확장자를 함께 지정한다. */
export const TRADE_IMAGE_ACCEPT = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_IMAGE_EXTENSIONS.map((extension) => `.${extension}`),
].join(',');

export const UNSUPPORTED_IMAGE_TYPE_MESSAGE = '지원하지 않는 형식입니다.';
export const IMAGE_TOO_LARGE_MESSAGE = `사진은 한 장당 ${MAX_TRADE_IMAGE_SIZE_MB}MB 이하만 올릴 수 있어요.`;

export type TradeImageRejection = 'unsupported-type' | 'too-large';

function readExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');

  return dotIndex === -1 ? '' : fileName.slice(dotIndex + 1).toLowerCase();
}

/**
 * accept 속성은 파일 선택창 필터일 뿐이라 우회할 수 있으므로 선택된 파일을 다시 검사한다.
 * 일부 브라우저는 type을 빈 값으로 주므로, 확장자는 항상 보고 type은 값이 있을 때만 확인한다.
 */
export function validateTradeImage(file: File): TradeImageRejection | null {
  const hasAllowedExtension = ALLOWED_IMAGE_EXTENSIONS.includes(
    readExtension(file.name),
  );
  const hasAllowedType =
    file.type === '' || ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase());

  if (!hasAllowedExtension || !hasAllowedType) {
    return 'unsupported-type';
  }

  if (file.size > MAX_TRADE_IMAGE_SIZE_BYTES) {
    return 'too-large';
  }

  return null;
}
