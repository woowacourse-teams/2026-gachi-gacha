import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import imageCompression from 'browser-image-compression';

import {
  compressTradeImages,
  TRADE_IMAGE_COMPRESSION_ERROR_MESSAGE,
  type TradeImageCompressionProgress,
} from './compressTradeImages';
import { encodeTradeImageWithWasm } from './encodeTradeImageWithWasm';

jest.mock('browser-image-compression', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./encodeTradeImageWithWasm', () => ({
  encodeTradeImageWithWasm: jest.fn(),
}));

const mockedImageCompression = jest.mocked(imageCompression);
const mockedWasmEncoder = jest.mocked(encodeTradeImageWithWasm);

describe('compressTradeImages', () => {
  beforeEach(() => {
    mockedImageCompression.mockReset();
    mockedWasmEncoder.mockReset();
    mockedWasmEncoder.mockResolvedValue(
      new Blob(['wasm-webp'], { type: 'image/webp' }),
    );
    mockedImageCompression.mockImplementation((async (file, options) => {
      options.onProgress?.(50);
      options.onProgress?.(100);

      return new File([`compressed-${file.name}`], file.name, {
        type: options.fileType ?? file.type,
        lastModified: file.lastModified,
      });
    }) as typeof imageCompression);
  });

  it('WASM WebP 변환으로 원래 순서와 파일명을 유지한다', async () => {
    const files = [
      new File(['first'], 'kuromi.png', {
        type: 'image/png',
        lastModified: 10,
      }),
      new File(['second'], 'cinnamoroll.jpeg', {
        type: 'image/jpeg',
        lastModified: 20,
      }),
    ];

    const compressedFiles = await compressTradeImages(files);

    expect(mockedWasmEncoder).toHaveBeenCalledTimes(2);
    expect(mockedWasmEncoder).toHaveBeenNthCalledWith(
      1,
      files[0]!,
      expect.any(AbortSignal),
    );
    expect(mockedImageCompression).not.toHaveBeenCalled();
    expect(compressedFiles.map(({ name }) => name)).toEqual([
      'kuromi.webp',
      'cinnamoroll.webp',
    ]);
    expect(compressedFiles.every(({ type }) => type === 'image/webp')).toBe(
      true,
    );
    expect(compressedFiles.map(({ lastModified }) => lastModified)).toEqual([
      10, 20,
    ]);
  });

  it('모든 이미지의 진행률 평균과 완료 개수를 알린다', async () => {
    const progressEvents: TradeImageCompressionProgress[] = [];
    const files = [
      new File(['first'], 'first.png', { type: 'image/png' }),
      new File(['second'], 'second.png', { type: 'image/png' }),
    ];

    await compressTradeImages(files, (progress) => {
      progressEvents.push(progress);
    });

    expect(progressEvents).toContainEqual({
      percentage: 100,
      completedCount: 2,
      totalCount: 2,
    });
    expect(
      progressEvents.every(
        (progress, index) =>
          index === 0 ||
          progress.percentage >= (progressEvents[index - 1]?.percentage ?? 0),
      ),
    ).toBe(true);
  });

  it('대기 시간을 줄이되 동시에 최대 두 장만 압축한다', async () => {
    let activeCompressionCount = 0;
    let maximumActiveCompressionCount = 0;

    mockedWasmEncoder.mockImplementation(async () => {
      activeCompressionCount += 1;
      maximumActiveCompressionCount = Math.max(
        maximumActiveCompressionCount,
        activeCompressionCount,
      );

      await new Promise((resolve) => setTimeout(resolve, 0));
      activeCompressionCount -= 1;

      return new Blob(['webp'], { type: 'image/webp' });
    });

    await compressTradeImages([
      new File(['first'], 'first.png', { type: 'image/png' }),
      new File(['second'], 'second.png', { type: 'image/png' }),
      new File(['third'], 'third.png', { type: 'image/png' }),
    ]);

    expect(maximumActiveCompressionCount).toBe(2);
  });

  it('WASM WebP도 실패하면 JPEG로 폴백한다', async () => {
    mockedWasmEncoder.mockRejectedValueOnce(new Error('WASM loading failed'));

    const [compressedFile] = await compressTradeImages([
      new File(['image'], 'kuromi.png', { type: 'image/png' }),
    ]);

    expect(mockedImageCompression).toHaveBeenNthCalledWith(
      1,
      expect.any(File),
      expect.objectContaining({ fileType: 'image/jpeg' }),
    );
    expect(compressedFile).toMatchObject({
      name: 'kuromi.jpg',
      type: 'image/jpeg',
    });
  });

  it('JPEG 폴백에서도 PNG가 반환되면 등록을 중단한다', async () => {
    mockedImageCompression.mockResolvedValueOnce(
      new File(['unsupported'], 'kuromi.png', { type: 'image/png' }),
    );
    mockedWasmEncoder.mockRejectedValueOnce(new Error('WASM encoding failed'));

    await expect(
      compressTradeImages([
        new File(['image'], 'kuromi.png', { type: 'image/png' }),
      ]),
    ).rejects.toThrow(TRADE_IMAGE_COMPRESSION_ERROR_MESSAGE);
  });

  it('WASM WebP와 JPEG 모두 실패하면 안내 오류를 반환한다', async () => {
    mockedImageCompression.mockRejectedValueOnce(
      new Error('JPEG encoding failed'),
    );
    mockedWasmEncoder.mockRejectedValueOnce(new Error('WASM encoding failed'));

    await expect(
      compressTradeImages([
        new File(['image'], 'kuromi.png', { type: 'image/png' }),
      ]),
    ).rejects.toThrow(TRADE_IMAGE_COMPRESSION_ERROR_MESSAGE);
  });
});
