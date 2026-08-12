export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

export const SUCCESS_CODE = 'SUCCESS';

export type NearbyStoresFailure = 'offline' | 'server';

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

export function toNearbyStoresFailure(cause: unknown): NearbyStoresFailure {
  return cause instanceof TypeError ? 'offline' : 'server';
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
    throw new Error(`nearby-stores/http-${response.status}`);
  }

  const body: unknown = await response.json();

  if (!isApiResponse(body)) {
    throw new Error('nearby-stores/invalid-response');
  }

  if (body.code !== SUCCESS_CODE || body.data == null) {
    throw new Error(`nearby-stores/${body.code}`);
  }

  return body.data as NearbyStoresData;
}
