import { isApiResponse } from '@/shared/api/isApiResponse';

import { AuthApiError } from './AuthApiError';
import { authenticatedFetch } from './authenticatedFetch';

const FILE_UPLOAD_API_PATH = '/api/v1/files';
const JSON_CONTENT_TYPE = 'application/json';

function readUploadedProfileImageUrl(value: unknown): string | null {
  if (!isApiResponse(value) || value.code !== 'C000') {
    return null;
  }

  const data = value.data;

  if (typeof data !== 'object' || data === null || !('files' in data)) {
    return null;
  }

  const files = data.files;

  if (!Array.isArray(files) || files.length !== 1) {
    return null;
  }

  const uploadedFile = files[0];

  if (
    typeof uploadedFile !== 'object' ||
    uploadedFile === null ||
    !('url' in uploadedFile) ||
    typeof uploadedFile.url !== 'string' ||
    !uploadedFile.url.trim()
  ) {
    return null;
  }

  return uploadedFile.url;
}

export async function uploadProfileImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('files', file);

  const response = await authenticatedFetch(FILE_UPLOAD_API_PATH, {
    method: 'POST',
    body: formData,
  });
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    throw new AuthApiError(
      '서버가 JSON 형식으로 응답하지 않았습니다.',
      response.status,
    );
  }

  const responseBody: unknown = await response.json();

  if (!response.ok) {
    const message = isApiResponse(responseBody)
      ? responseBody.message
      : '프로필 사진을 업로드하지 못했습니다.';

    throw new AuthApiError(message, response.status);
  }

  const profileImageUrl = readUploadedProfileImageUrl(responseBody);

  if (!profileImageUrl) {
    throw new AuthApiError(
      '프로필 사진 업로드 응답 형식이 올바르지 않습니다.',
      response.status,
    );
  }

  return profileImageUrl;
}
