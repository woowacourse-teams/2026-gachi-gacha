import { describe, expect, it } from '@jest/globals';

import {
  MAX_TRADE_IMAGE_SIZE_MB,
  TRADE_IMAGE_ACCEPT,
  validateTradeImage,
} from './tradeImagePolicy';

function createFile(name: string, type: string, size = 1024): File {
  const file = new File(['image'], name, { type });

  Object.defineProperty(file, 'size', { value: size });

  return file;
}

describe('tradeImagePolicy', () => {
  it('파일 선택창은 JPG, PNG, WEBP만 고를 수 있게 한다', () => {
    expect(TRADE_IMAGE_ACCEPT).toBe(
      'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
    );
  });

  it('JPG, PNG, WEBP는 허용한다', () => {
    expect(validateTradeImage(createFile('a.jpg', 'image/jpeg'))).toBeNull();
    expect(validateTradeImage(createFile('a.JPEG', 'image/jpeg'))).toBeNull();
    expect(validateTradeImage(createFile('a.png', 'image/png'))).toBeNull();
    expect(validateTradeImage(createFile('a.webp', 'image/webp'))).toBeNull();
  });

  it('HEIC, GIF, 영상은 지원하지 않는 형식으로 거른다', () => {
    expect(validateTradeImage(createFile('a.heic', 'image/heic'))).toBe(
      'unsupported-type',
    );
    expect(validateTradeImage(createFile('a.gif', 'image/gif'))).toBe(
      'unsupported-type',
    );
    expect(validateTradeImage(createFile('a.mp4', 'video/mp4'))).toBe(
      'unsupported-type',
    );
  });

  it('브라우저가 type을 비워 주면 확장자로 판단하고, 확장자와 type이 다르면 거른다', () => {
    expect(validateTradeImage(createFile('a.jpg', ''))).toBeNull();
    expect(validateTradeImage(createFile('a.heic', ''))).toBe(
      'unsupported-type',
    );
    expect(validateTradeImage(createFile('a.jpg', 'image/gif'))).toBe(
      'unsupported-type',
    );
    expect(validateTradeImage(createFile('photo', 'image/jpeg'))).toBe(
      'unsupported-type',
    );
  });

  it(`${MAX_TRADE_IMAGE_SIZE_MB}MB를 넘는 사진은 용량 초과로 거른다`, () => {
    const limit = MAX_TRADE_IMAGE_SIZE_MB * 1024 * 1024;

    expect(
      validateTradeImage(createFile('a.jpg', 'image/jpeg', limit)),
    ).toBeNull();
    expect(
      validateTradeImage(createFile('a.jpg', 'image/jpeg', limit + 1)),
    ).toBe('too-large');
  });
});
