import { describe, expect, it } from '@jest/globals';

import {
  getTradeRequestErrorMessage,
  PAYLOAD_TOO_LARGE_MESSAGE,
} from './getTradeRequestErrorMessage';

const FALLBACK = '교환 게시글을 등록하지 못했습니다.';

describe('getTradeRequestErrorMessage', () => {
  it('413이면 본문과 관계없이 사진 용량 안내를 반환한다', () => {
    expect(getTradeRequestErrorMessage(413, null, FALLBACK)).toBe(
      PAYLOAD_TOO_LARGE_MESSAGE,
    );
  });

  it('검증 실패 항목을 항목 이름과 사유로 줄마다 안내한다', () => {
    const body = {
      code: 'CE001',
      message: '유효하지 않은 입력값입니다.',
      errors: [
        { field: 'title', value: '', reason: '공백일 수 없습니다' },
        {
          field: 'purchaseStore.address',
          value: '',
          reason: '공백일 수 없습니다',
        },
        { field: 'unknownField', value: '', reason: '올바르지 않습니다' },
      ],
    };

    expect(getTradeRequestErrorMessage(400, body, FALLBACK)).toBe(
      '제목: 공백일 수 없습니다\n구매 매장: 공백일 수 없습니다\n올바르지 않습니다',
    );
  });

  it('항목별 사유가 없으면 서버 메시지, 그것도 없으면 기본 문구를 반환한다', () => {
    expect(
      getTradeRequestErrorMessage(
        403,
        { code: 'T003', message: '작성자만 수정할 수 있습니다.' },
        FALLBACK,
      ),
    ).toBe('작성자만 수정할 수 있습니다.');
    expect(getTradeRequestErrorMessage(500, null, FALLBACK)).toBe(FALLBACK);
  });
});
