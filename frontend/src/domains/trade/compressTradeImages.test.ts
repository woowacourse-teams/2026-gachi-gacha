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
        type: options.fileType ?? file.type,
        lastModified: file.lastModified,
      });
    }) as typeof imageCompression);
  });

  it('WebP 변환을 우선하고 원래 순서와 파일명을 유지한다', async () => {
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
        useWebWorker: false,
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

  it('WebP 변환이 실패하면 PNG로 다시 압축한다', async () => {
    mockedImageCompression
      .mockRejectedValueOnce(new Error('WebP encoding failed'))
      .mockResolvedValueOnce(
        new File(['fallback'], 'kuromi.png', { type: 'image/png' }),
      );

    const [compressedFile] = await compressTradeImages([
      new File(['image'], 'kuromi.jpeg', { type: 'image/jpeg' }),
    ]);

    expect(mockedImageCompression).toHaveBeenCalledTimes(2);
    expect(mockedImageCompression).toHaveBeenNthCalledWith(
      2,
      expect.any(File),
      expect.objectContaining({
        fileType: 'image/png',
        useWebWorker: false,
      }),
    );
    expect(compressedFile).toMatchObject({
      name: 'kuromi.png',
      type: 'image/png',
    });
  });

  it('WebP 요청에 PNG가 반환되면 PNG 폴백 결과로 사용한다', async () => {
    mockedImageCompression.mockResolvedValueOnce(
      new File(['fallback'], 'kuromi.png', { type: 'image/png' }),
    );

    const [compressedFile] = await compressTradeImages([
      new File(['image'], 'kuromi.jpeg', { type: 'image/jpeg' }),
    ]);

    expect(mockedImageCompression).toHaveBeenCalledTimes(1);
    expect(compressedFile).toMatchObject({
      name: 'kuromi.png',
      type: 'image/png',
    });
  });

  it('WebP 요청에 지원하지 않는 형식이 반환되면 PNG로 다시 압축한다', async () => {
    mockedImageCompression
      .mockResolvedValueOnce(
        new File(['unsupported'], 'kuromi.jpeg', { type: 'image/jpeg' }),
      )
      .mockResolvedValueOnce(
        new File(['fallback'], 'kuromi.png', { type: 'image/png' }),
      );

    const [compressedFile] = await compressTradeImages([
      new File(['image'], 'kuromi.jpeg', { type: 'image/jpeg' }),
    ]);

    expect(mockedImageCompression).toHaveBeenCalledTimes(2);
    expect(mockedImageCompression).toHaveBeenNthCalledWith(
      2,
      expect.any(File),
      expect.objectContaining({ fileType: 'image/png' }),
    );
    expect(compressedFile).toMatchObject({
      name: 'kuromi.png',
      type: 'image/png',
    });
  });

  it('WebP와 PNG 모두 변환하지 못하면 사용자용 오류로 실패한다', async () => {
    mockedImageCompression
      .mockRejectedValueOnce(new Error('WebP encoding failed'))
      .mockRejectedValueOnce(new Error('PNG encoding failed'));

    await expect(
      compressTradeImages([
        new File(['image'], 'kuromi.png', { type: 'image/png' }),
      ]),
    ).rejects.toThrow(TRADE_IMAGE_COMPRESSION_ERROR_MESSAGE);
  });
});
