export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

export const SUCCESS_CODE = 'SUCCESS';

export interface NearbyStore {
  storeId: number;
  thumbnailUrl: string;
  latitude: number;
  longitude: number;
  distance: number;
}

export interface NearbyStoresData {
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  stores: NearbyStore[];
}

export const DEFAULT_RADIUS = 3000;

interface GetNearbyStoresParams {
  latitude: number;
  longitude: number;
  radius: number;
}

function isApiResponse(body: unknown): body is ApiResponse<unknown> {
  if (typeof body !== 'object' || body === null) return false;

  const { code, message } = body as Partial<ApiResponse<unknown>>;

  return typeof code === 'string' && typeof message === 'string';
}

export async function getNearbyStores(
  { latitude, longitude, radius }: GetNearbyStoresParams,
  signal: AbortSignal,
): Promise<NearbyStoresData> {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    radius: String(radius),
  });

  const response = await fetch(`/api/v1/stores/nearby?${query}`, { signal });

  if (!response.ok) {
    throw new Error(`주변 매장을 불러오지 못했습니다. (${response.status})`);
  }

  const body: unknown = await response.json();

  if (!isApiResponse(body)) {
    throw new Error('주변 매장 응답 형식이 올바르지 않습니다.');
  }

  if (body.code !== SUCCESS_CODE || body.data == null) {
    throw new Error(body.message || '주변 매장을 불러오지 못했습니다.');
  }

  return body.data as NearbyStoresData;
}
