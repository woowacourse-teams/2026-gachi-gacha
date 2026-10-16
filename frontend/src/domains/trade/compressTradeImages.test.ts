import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import imageCompression from 'browser-image-compression';

import {
  compressTradeImages,
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

  it('Safari가 WebP 대신 PNG를 반환해도 실제 형식에 맞춰 압축 결과를 사용한다', async () => {
    mockedImageCompression.mockResolvedValueOnce(
      new File(['fallback'], 'kuromi.png', { type: 'image/png' }),
    );

    const [compressedFile] = await compressTradeImages([
      new File(['image'], 'kuromi.jpeg', {
        type: 'image/jpeg',
        lastModified: 10,
      }),
    ]);

    expect(mockedImageCompression).toHaveBeenCalledTimes(1);
    expect(compressedFile).toEqual(
      expect.objectContaining({
        name: 'kuromi.png',
        type: 'image/png',
        lastModified: 10,
      }),
    );
  });

  it('Worker 압축이 실패하면 원본 형식으로 메인 스레드에서 재시도한다', async () => {
    const file = new File(['image'], 'kuromi.jpeg', {
      type: 'image/jpeg',
    });

    mockedImageCompression
      .mockRejectedValueOnce(new Error('Worker 압축 실패'))
      .mockResolvedValueOnce(
        new File(['compressed'], 'kuromi.jpeg', { type: 'image/jpeg' }),
      );

    const [compressedFile] = await compressTradeImages([file]);

    expect(mockedImageCompression).toHaveBeenCalledTimes(2);
    expect(mockedImageCompression).toHaveBeenNthCalledWith(
      2,
      file,
      expect.objectContaining({
        fileType: 'image/jpeg',
        useWebWorker: false,
      }),
    );
    expect(compressedFile).toEqual(
      expect.objectContaining({ name: 'kuromi.jpg', type: 'image/jpeg' }),
    );
  });

  it('Worker와 메인 스레드 압축이 모두 실패하면 검증된 원본을 사용한다', async () => {
    const file = new File(['image'], 'kuromi.png', { type: 'image/png' });

    mockedImageCompression.mockRejectedValue(new Error('압축 실패'));

    const [compressedFile] = await compressTradeImages([file]);

    expect(mockedImageCompression).toHaveBeenCalledTimes(2);
    expect(compressedFile).toBe(file);
  });

  it('iOS의 캔버스 메모리를 보호하기 위해 여러 이미지를 순차 압축한다', async () => {
    let activeCompressionCount = 0;
    let maximumActiveCompressionCount = 0;

    mockedImageCompression.mockImplementation((async (file: File) => {
      activeCompressionCount += 1;
      maximumActiveCompressionCount = Math.max(
        maximumActiveCompressionCount,
        activeCompressionCount,
      );

      await Promise.resolve();
      activeCompressionCount -= 1;

      return new File([file], file.name, { type: 'image/webp' });
    }) as unknown as typeof imageCompression);

    await compressTradeImages([
      new File(['first'], 'first.png', { type: 'image/png' }),
      new File(['second'], 'second.png', { type: 'image/png' }),
      new File(['third'], 'third.png', { type: 'image/png' }),
    ]);

    expect(maximumActiveCompressionCount).toBe(1);
  });
});
