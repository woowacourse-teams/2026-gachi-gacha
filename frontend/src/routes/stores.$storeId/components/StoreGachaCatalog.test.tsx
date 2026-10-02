import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/server';

import { StoreGachaCatalog } from './StoreGachaCatalog';

describe('StoreGachaCatalog', () => {
  it('매장 보유 가챠의 섬네일과 이름만 표시한다', async () => {
    server.use(
      http.get('/api/v1/stores/1/gachas', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            content: [
              {
                gachaId: 10,
                gachaName: '산리오 캐릭터즈 피규어',
                thumbnailUrl: 'https://example.com/gacha.jpg',
              },
            ],
            totalElements: 1,
            number: 0,
            totalPages: 1,
          },
        }),
      ),
    );

    render(<StoreGachaCatalog storeId={1} />);

    expect(
      await screen.findByText('산리오 캐릭터즈 피규어'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: '산리오 캐릭터즈 피규어 섬네일',
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText('카테고리 미등록')).not.toBeInTheDocument();
  });

  it('이름이 누락된 보유 가챠도 대체 이름과 섬네일로 표시한다', async () => {
    server.use(
      http.get('/api/v1/stores/17/gachas', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            content: [
              {
                gachaId: 188,
                gachaName: null,
                thumbnailUrl: 'https://example.com/188.jpg',
              },
            ],
            totalElements: 1,
            number: 0,
            totalPages: 1,
          },
        }),
      ),
    );

    render(<StoreGachaCatalog storeId={17} />);

    expect(await screen.findByText('이름 미등록 가챠')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: '이름 미등록 가챠 섬네일' }),
    ).toHaveAttribute('src', 'https://example.com/188.jpg');
    expect(
      screen.queryByText('매장 보유 가챠 응답 형식이 올바르지 않습니다.'),
    ).not.toBeInTheDocument();
  });
});
