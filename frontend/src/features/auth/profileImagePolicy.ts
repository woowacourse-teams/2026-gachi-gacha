const ALLOWED_PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_PROFILE_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

// 백엔드 multipart max-file-size와 맞춘다.
export const MAX_PROFILE_IMAGE_SIZE_MB = 10;
const MAX_PROFILE_IMAGE_SIZE_BYTES = MAX_PROFILE_IMAGE_SIZE_MB * 1024 * 1024;

export const PROFILE_IMAGE_ACCEPT = [
  ...ALLOWED_PROFILE_IMAGE_TYPES,
  ...ALLOWED_PROFILE_IMAGE_EXTENSIONS.map((extension) => `.${extension}`),
].join(',');

export const PROFILE_IMAGE_UNSUPPORTED_TYPE_MESSAGE =
  'JPG, PNG, WebP 형식의 사진만 올릴 수 있어요.';
export const PROFILE_IMAGE_TOO_LARGE_MESSAGE = `프로필 사진은 ${MAX_PROFILE_IMAGE_SIZE_MB}MB 이하만 올릴 수 있어요.`;

export type ProfileImageRejection = 'unsupported-type' | 'too-large';

function readExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');

  return dotIndex === -1 ? '' : fileName.slice(dotIndex + 1).toLowerCase();
}

export function validateProfileImage(file: File): ProfileImageRejection | null {
  const hasAllowedExtension = ALLOWED_PROFILE_IMAGE_EXTENSIONS.includes(
    readExtension(file.name),
  );
  const hasAllowedType =
    file.type === '' ||
    ALLOWED_PROFILE_IMAGE_TYPES.includes(file.type.toLowerCase());

  if (!hasAllowedExtension || !hasAllowedType) {
    return 'unsupported-type';
  }

  if (file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
    return 'too-large';
  }

  return null;
}
