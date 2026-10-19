const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

export const MAX_CHAT_IMAGE_COUNT = 10;
export const MAX_CHAT_IMAGE_SIZE_MB = 10;
const MAX_CHAT_IMAGE_SIZE_BYTES = MAX_CHAT_IMAGE_SIZE_MB * 1024 * 1024;

export const CHAT_IMAGE_ACCEPT = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_IMAGE_EXTENSIONS.map((extension) => `.${extension}`),
].join(',');

export type ChatImageRejection = 'unsupported-type' | 'too-large';

function readExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');

  return dotIndex === -1 ? '' : fileName.slice(dotIndex + 1).toLowerCase();
}

export function validateChatImage(file: File): ChatImageRejection | null {
  const hasAllowedExtension = ALLOWED_IMAGE_EXTENSIONS.includes(
    readExtension(file.name),
  );
  const hasAllowedType =
    file.type === '' || ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase());

  if (!hasAllowedExtension || !hasAllowedType) {
    return 'unsupported-type';
  }

  if (file.size > MAX_CHAT_IMAGE_SIZE_BYTES) {
    return 'too-large';
  }

  return null;
}
