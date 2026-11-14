import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import imageCompression from 'browser-image-compression';

import {
  CHAT_IMAGE_COMPRESSION_ERROR_MESSAGE,
  compressChatImages,
} from './compressChatImages';

jest.mock('browser-image-compression', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedImageCompression = jest.mocked(imageCompression);

function compressedFile(type: 'image/webp' | 'image/png', name = 'result') {
  return new File(['compressed'], name, { type });
}

describe('compressChatImages', () => {
  beforeEach(() => {
    mockedImageCompression.mockReset();
  });

  it('선택 순서대로 WebP 파일을 만든다', async () => {
    mockedImageCompression
      .mockResolvedValueOnce(compressedFile('image/webp'))
      .mockResolvedValueOnce(compressedFile('image/webp'));

    const result = await compressChatImages([
      new File(['a'], 'first.jpg', { type: 'image/jpeg' }),
      new File(['b'], 'second.png', { type: 'image/png' }),
    ]);

    expect(result.map((file) => file.name)).toEqual([
      'first.webp',
      'second.webp',
    ]);
  });

  it('Safari가 WebP 요청에 PNG를 반환하면 해당 PNG를 사용한다', async () => {
    mockedImageCompression.mockResolvedValue(compressedFile('image/png'));

    const [result] = await compressChatImages([
      new File(['a'], 'photo.jpg', { type: 'image/jpeg' }),
    ]);

    expect(result?.name).toBe('photo.png');
    expect(mockedImageCompression).toHaveBeenCalledTimes(1);
  });

  it('WebP 변환 실패 시 메인 스레드에서 PNG 변환을 시도한다', async () => {
    mockedImageCompression
      .mockRejectedValueOnce(new Error('worker failed'))
      .mockResolvedValueOnce(compressedFile('image/png'));

    const [result] = await compressChatImages([
      new File(['a'], 'photo.jpg', { type: 'image/jpeg' }),
    ]);

    expect(result?.name).toBe('photo.png');
    expect(mockedImageCompression.mock.calls[1]?.[1]).toMatchObject({
      fileType: 'image/png',
      useWebWorker: false,
    });
  });

  it('두 변환이 모두 실패하면 원본 대신 안내 오류를 반환한다', async () => {
    mockedImageCompression.mockRejectedValue(new Error('unsupported'));

    await expect(
      compressChatImages([
        new File(['original'], 'photo.jpg', { type: 'image/jpeg' }),
      ]),
    ).rejects.toThrow(CHAT_IMAGE_COMPRESSION_ERROR_MESSAGE);
  });

  it('모바일 메모리를 위해 다음 파일은 이전 압축 완료 후 처리한다', async () => {
    let finishFirst: ((file: File) => void) | undefined;
    mockedImageCompression
      .mockImplementationOnce(
        (() =>
          new Promise<File>((resolve) => {
            finishFirst = resolve;
          })) as unknown as typeof imageCompression,
      )
      .mockResolvedValueOnce(compressedFile('image/webp'));

    const pending = compressChatImages([
      new File(['a'], 'first.jpg', { type: 'image/jpeg' }),
      new File(['b'], 'second.jpg', { type: 'image/jpeg' }),
    ]);

    expect(mockedImageCompression).toHaveBeenCalledTimes(1);
    finishFirst?.(compressedFile('image/webp'));
    await pending;
    expect(mockedImageCompression).toHaveBeenCalledTimes(2);
  });
});
