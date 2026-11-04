import { describe, expect, it } from '@jest/globals';

import { MAX_CHAT_IMAGE_SIZE_MB, validateChatImage } from './chatImagePolicy';

describe('validateChatImage', () => {
  it.each([
    ['photo.jpg', 'image/jpeg'],
    ['photo.PNG', 'image/png'],
    ['photo.webp', 'image/webp'],
    ['photo.jpeg', ''],
  ])('%s 형식의 정적 이미지를 허용한다', (name, type) => {
    expect(validateChatImage(new File(['image'], name, { type }))).toBeNull();
  });

  it('지원하지 않는 이미지 형식을 거절한다', () => {
    expect(
      validateChatImage(
        new File(['image'], 'photo.gif', { type: 'image/gif' }),
      ),
    ).toBe('unsupported-type');
  });

  it('백엔드 제한보다 큰 원본 이미지를 거절한다', () => {
    const file = new File(
      [new Uint8Array(MAX_CHAT_IMAGE_SIZE_MB * 1024 * 1024 + 1)],
      'large.jpg',
      { type: 'image/jpeg' },
    );

    expect(validateChatImage(file)).toBe('too-large');
  });
});
