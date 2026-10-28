import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';
import { File } from 'expo-file-system';

import type { TradeImageUpload } from './tradeTypes';

export const MAX_TRADE_IMAGE_COUNT = 5;
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const MAX_DIMENSION = 800;
const COMPRESSION_QUALITY = 0.8;
const FALLBACK_COMPRESSION_QUALITY = 0.55;
const MAX_COMPRESSED_BYTES = 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

function extensionOf(value: string): string {
  return value.split('?')[0]?.split('.').pop()?.toLowerCase() ?? '';
}

export function validateTradeImageAsset(asset: ImagePickerAsset) {
  if (asset.fileSize !== undefined && asset.fileSize > MAX_SOURCE_BYTES) {
    throw new Error('사진은 한 장당 10MB 이하만 올릴 수 있어요.');
  }

  const mimeType = asset.mimeType?.toLowerCase();
  const extension = extensionOf(asset.fileName || asset.uri);
  const hasValidMime = mimeType ? ALLOWED_MIME_TYPES.has(mimeType) : false;
  const hasValidExtension = ALLOWED_EXTENSIONS.has(extension);

  if ((mimeType && !hasValidMime) || (!mimeType && !hasValidExtension)) {
    throw new Error('JPG, PNG, WebP 형식의 사진만 올릴 수 있어요.');
  }
  if (!asset.uri || asset.width <= 0 || asset.height <= 0) {
    throw new Error('선택한 사진 정보를 확인하지 못했습니다.');
  }
}

function resizeAction(asset: ImagePickerAsset) {
  const longestSide = Math.max(asset.width, asset.height);
  if (longestSide <= MAX_DIMENSION) return [];

  return [
    asset.width >= asset.height
      ? { resize: { width: MAX_DIMENSION } }
      : { resize: { height: MAX_DIMENSION } },
  ];
}

async function compressOne(
  asset: ImagePickerAsset,
  index: number,
): Promise<TradeImageUpload> {
  validateTradeImageAsset(asset);

  try {
    let result = await manipulateAsync(asset.uri, resizeAction(asset), {
      compress: COMPRESSION_QUALITY,
      format: SaveFormat.WEBP,
    });
    if (new File(result.uri).size > MAX_COMPRESSED_BYTES) {
      result = await manipulateAsync(result.uri, [], {
        compress: FALLBACK_COMPRESSION_QUALITY,
        format: SaveFormat.WEBP,
      });
    }
    if (new File(result.uri).size > MAX_COMPRESSED_BYTES) {
      throw new Error('compressed-image-too-large');
    }
    return {
      fileName: `trade-image-${Date.now()}-${index + 1}.webp`,
      mimeType: 'image/webp',
      uri: result.uri,
    };
  } catch (error) {
    throw new Error(
      '사진을 최적화하지 못했습니다. 다른 JPG, PNG 또는 WebP 사진을 선택해 주세요.',
      { cause: error },
    );
  }
}

export async function compressTradeImages(
  assets: readonly ImagePickerAsset[],
  onProgress: (completed: number, total: number) => void,
): Promise<TradeImageUpload[]> {
  if (assets.length === 0) return [];
  if (assets.length > MAX_TRADE_IMAGE_COUNT) {
    throw new Error(`사진은 최대 ${MAX_TRADE_IMAGE_COUNT}장까지 올릴 수 있어요.`);
  }

  const results: TradeImageUpload[] = [];
  for (const [index, asset] of assets.entries()) {
    results.push(await compressOne(asset, index));
    onProgress(results.length, assets.length);
  }
  return results;
}

export function clearCompressedTradeImages(images: readonly TradeImageUpload[]) {
  images.forEach(({ uri }) => {
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      // Expo cache files are best-effort cleanup and may already be removed by the OS.
    }
  });
}
