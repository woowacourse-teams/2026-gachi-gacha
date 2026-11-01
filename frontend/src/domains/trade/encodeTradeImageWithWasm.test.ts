import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import encode from '@jsquash/webp/encode';

import { encodeTradeImageWithWasm } from './encodeTradeImageWithWasm';

jest.mock('@jsquash/webp/encode', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedEncode = jest.mocked(encode);
const originalImage = globalThis.Image;
const originalCreateObjectURL = Object.getOwnPropertyDescriptor(
  URL,
  'createObjectURL',
);
const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(
  URL,
  'revokeObjectURL',
);

class LoadedImage {
  naturalWidth = 1600;
  naturalHeight = 800;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

describe('encodeTradeImageWithWasm', () => {
  const imageData = {
    data: new Uint8ClampedArray(800 * 400 * 4),
    width: 800,
    height: 400,
  } as ImageData;
  const drawImage = jest.fn();
  const getImageData = jest.fn(() => imageData);
  let getContextSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    mockedEncode.mockReset();
    drawImage.mockClear();
    getImageData.mockClear();
    Object.defineProperty(globalThis, 'Image', {
      configurable: true,
      value: LoadedImage,
    });
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: jest.fn(() => 'blob:test-image'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: jest.fn(),
    });
    getContextSpy = jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({
        drawImage,
        getImageData,
      } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    getContextSpy.mockRestore();
    Object.defineProperty(globalThis, 'Image', {
      configurable: true,
      value: originalImage,
    });
    if (originalCreateObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', originalCreateObjectURL);
    }
    if (originalRevokeObjectURL) {
      Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectURL);
    }
  });

  it('800px로 축소한 픽셀을 WASM WebP로 인코딩한다', async () => {
    mockedEncode.mockResolvedValueOnce(new Uint8Array(100).buffer);

    const blob = await encodeTradeImageWithWasm(
      new File(['image'], 'image.png', { type: 'image/png' }),
    );

    expect(drawImage).toHaveBeenCalledWith(
      expect.any(LoadedImage),
      0,
      0,
      800,
      400,
    );
    expect(getImageData).toHaveBeenCalledWith(0, 0, 800, 400);
    expect(mockedEncode).toHaveBeenCalledWith(imageData, { quality: 80 });
    expect(blob).toMatchObject({ type: 'image/webp', size: 100 });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-image');
  });

  it('결과가 1MB를 넘으면 품질을 낮춰 다시 인코딩한다', async () => {
    mockedEncode
      .mockResolvedValueOnce(new Uint8Array(1024 * 1024 + 1).buffer)
      .mockResolvedValueOnce(new Uint8Array(200).buffer);

    const blob = await encodeTradeImageWithWasm(
      new File(['image'], 'image.png', { type: 'image/png' }),
    );

    expect(mockedEncode).toHaveBeenNthCalledWith(1, imageData, { quality: 80 });
    expect(mockedEncode).toHaveBeenNthCalledWith(2, imageData, { quality: 65 });
    expect(blob.size).toBe(200);
  });
});
