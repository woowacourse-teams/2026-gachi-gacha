import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import * as AuthSession from '@/features/auth/AuthSessionContext';
import * as AuthTokenStorage from '@/features/auth/authTokenStorage';
import * as MemberIdReader from '@/features/auth/readMemberIdFromAccessToken';

import * as ErrorMonitoringClient from './errorMonitoringClient';
import { ErrorMonitoringContext } from './ErrorMonitoringContext';

const mockedUseAuthSession = jest.spyOn(AuthSession, 'useAuthSession');
const mockedReadAccessToken = jest.spyOn(AuthTokenStorage, 'readAccessToken');
const mockedReadMemberId = jest.spyOn(
  MemberIdReader,
  'readMemberIdFromAccessToken',
);
const mockedSetRoute = jest.spyOn(
  ErrorMonitoringClient,
  'setErrorMonitoringRoute',
);
const mockedSetUser = jest.spyOn(
  ErrorMonitoringClient,
  'setErrorMonitoringUser',
);

describe('Sentry 인증·라우팅 컨텍스트', () => {
  beforeEach(() => {
    mockedUseAuthSession.mockReturnValue({
      status: 'guest',
    } as ReturnType<typeof AuthSession.useAuthSession>);
    mockedReadAccessToken.mockReturnValue(null);
    mockedReadMemberId.mockReturnValue(null);
  });

  it('현재 pathname을 연결하고 비로그인 사용자 정보를 제거한다', async () => {
    render(
      <MemoryRouter initialEntries={['/search?query=산리오']}>
        <ErrorMonitoringContext />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockedSetRoute).toHaveBeenCalledWith('/search');
      expect(mockedSetUser).toHaveBeenCalledWith(null);
    });
  });

  it('로그인 상태에서 JWT의 내부 회원 식별자만 연결한다', async () => {
    mockedUseAuthSession.mockReturnValue({
      status: 'authenticated',
    } as ReturnType<typeof AuthSession.useAuthSession>);
    mockedReadAccessToken.mockReturnValue('access-token');
    mockedReadMemberId.mockReturnValue('42');

    render(
      <MemoryRouter initialEntries={['/mypage']}>
        <ErrorMonitoringContext />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockedReadMemberId).toHaveBeenCalledWith('access-token');
      expect(mockedSetUser).toHaveBeenCalledWith('42');
    });
  });
});
