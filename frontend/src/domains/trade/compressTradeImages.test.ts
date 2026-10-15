import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import imageCompression from 'browser-image-compression';

import {
  compressTradeImages,
  TRADE_IMAGE_COMPRESSION_ERROR_MESSAGE,
  type TradeImageCompressionProgress,
} from './compressTradeImages';

jest.mock('browser-image-compression', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedImageCompression = jest.mocked(imageCompression);

describe('compressTradeImages', () => {
  beforeEach(() => {
    mockedImageCompression.mockImplementation((async (file, options) => {
      options.onProgress?.(50);
      options.onProgress?.(100);

      return new File([`compressed-${file.name}`], file.name, {
        type: 'image/webp',
        lastModified: file.lastModified,
      });
    }) as typeof imageCompression);
  });

  it('WebP 정책으로 압축하고 원래 순서와 파일명을 유지한다', async () => {
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

    expect(mockedImageCompression).toHaveBeenCalledTimes(2);
    expect(mockedImageCompression).toHaveBeenNthCalledWith(
      1,
      files[0]!,
      expect.objectContaining({
        fileType: 'image/webp',
        initialQuality: 0.8,
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      }),
    );
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

  it('변환 결과가 WebP가 아니면 사용자용 오류로 실패한다', async () => {
    mockedImageCompression.mockResolvedValueOnce(
      new File(['fallback'], 'kuromi.png', { type: 'image/png' }),
    );

    await expect(
      compressTradeImages([
        new File(['image'], 'kuromi.png', { type: 'image/png' }),
      ]),
    ).rejects.toThrow(TRADE_IMAGE_COMPRESSION_ERROR_MESSAGE);
  });
});
