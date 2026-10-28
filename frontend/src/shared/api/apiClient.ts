const API_BASE_URL = '/api/v1';
const JSON_CONTENT_TYPE = 'application/json';

type ResponseParser<T> = (value: unknown) => T;

export async function apiClient<T>(
  path: string,
  parse: ResponseParser<T>,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type');

  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    throw new Error('서버가 JSON 형식으로 응답하지 않았습니다.');
  }

  const responseBody: unknown = await response.json();

  return parse(responseBody);
}
