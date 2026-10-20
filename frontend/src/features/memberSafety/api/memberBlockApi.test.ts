import { beforeEach, describe, expect, it } from '@jest/globals';
import { http, HttpResponse } from 'msw';

import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import { server } from '@/test/server';

import {
  getBlockedMembers,
  requestMemberBlock,
  requestMemberUnblock,
} from './memberBlockApi';

beforeEach(() => {
  storeAuthTokens({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  });
});

describe('memberBlockApi', () => {
  it('차단 목록 응답을 검증해 반환한다', async () => {
    server.use(
      http.get('/api/v1/blocks', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            blocks: [
              {
                memberId: 7,
                nickname: '쿠로미러버',
                blockedAt: '2026-10-20T09:00:00',
              },
            ],
          },
        }),
      ),
    );

    await expect(getBlockedMembers()).resolves.toEqual([
      {
        memberId: 7,
        nickname: '쿠로미러버',
        blockedAt: '2026-10-20T09:00:00',
      },
    ]);
  });

  it('차단과 해제를 계약에 맞는 메서드로 요청한다', async () => {
    const methods: string[] = [];

    server.use(
      http.put('/api/v1/blocks/7', ({ request }) => {
        methods.push(request.method);
        return HttpResponse.json({ code: 'C002', message: '차단 완료' });
      }),
      http.delete('/api/v1/blocks/7', ({ request }) => {
        methods.push(request.method);
        return HttpResponse.json({ code: 'C003', message: '차단 해제 완료' });
      }),
    );

    await requestMemberBlock(7);
    await requestMemberUnblock(7);

    expect(methods).toEqual(['PUT', 'DELETE']);
  });

  it('응답 형식이 다르면 목록을 사용하지 않는다', async () => {
    server.use(
      http.get('/api/v1/blocks', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: { blocks: [{ memberId: '7', nickname: '잘못된 응답' }] },
        }),
      ),
    );

    await expect(getBlockedMembers()).rejects.toThrow(
      '차단한 사용자 목록 응답 형식이 올바르지 않습니다.',
    );
  });
});
