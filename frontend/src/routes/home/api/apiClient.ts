import type { ApiResponse } from './apiResponse';

const API_BASE_URL = '/api/v1';

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const body = (await response.json()) as ApiResponse<T>;

  return body.data;
}
