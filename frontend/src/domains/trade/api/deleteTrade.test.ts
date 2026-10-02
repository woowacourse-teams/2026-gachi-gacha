import { beforeEach, describe, expect, it } from '@jest/globals';
import { http, HttpResponse } from 'msw';

import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import { server } from '@/test/server';

import { deleteTrade } from './deleteTrade';

describe('deleteTrade', () => {
  beforeEach(() => {
    storeAuthTokens({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('인증 헤더와 함께 DELETE 요청하고 C003 응답이면 성공한다', async () => {
    let authorization: string | null = null;

    server.use(
      http.delete('/api/v1/trades/15', ({ request }) => {
        authorization = request.headers.get('Authorization');

        return HttpResponse.json({ code: 'C003', message: '정상 삭제' });
      }),
    );

    await expect(deleteTrade(15)).resolves.toBeUndefined();
    expect(authorization).toBe('Bearer access-token');
  });

  it('본문 없는 204 응답도 성공으로 처리한다', async () => {
    server.use(
      http.delete(
        '/api/v1/trades/15',
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    await expect(deleteTrade(15)).resolves.toBeUndefined();
  });

  it('실패하면 서버 메시지로 에러를 던진다', async () => {
    server.use(
      http.delete('/api/v1/trades/15', () =>
        HttpResponse.json(
          { code: 'T003', message: '작성자만 삭제할 수 있습니다.' },
          { status: 403 },
        ),
      ),
    );

    await expect(deleteTrade(15)).rejects.toThrow(
      '작성자만 삭제할 수 있습니다.',
    );
  });
});
