import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';

import { useAuthSession } from '@/features/auth/AuthSessionContext';
import type {
  LaunchEventConfig,
  LaunchEventMetadata,
} from '@/features/launchEvent/launchEventConfig';
import {
  fetchLaunchEventMetadata,
  type LaunchEventReceipt,
  submitLaunchEvent,
} from '@/features/launchEvent/launchEventSubmission';
import { useLaunchEventClock } from '@/features/launchEvent/useLaunchEventClock';

import { LaunchEventForm } from './LaunchEventForm';
import { LaunchEventRoute } from './route';

jest.mock('@/features/auth/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('@/features/launchEvent/launchEventSubmission', () => ({
  fetchLaunchEventMetadata: jest.fn(),
  submitLaunchEvent: jest.fn(),
}));
jest.mock('@/features/launchEvent/useLaunchEventClock', () => ({
  useLaunchEventClock: jest.fn(),
}));
jest.mock('./LaunchEventForm', () => ({ LaunchEventForm: jest.fn() }));

const authMock = jest.mocked(useAuthSession);
const metadataMock = jest.mocked(fetchLaunchEventMetadata);
const submitMock = jest.mocked(submitLaunchEvent);
const clockMock = jest.mocked(useLaunchEventClock);
const formMock = jest.mocked(LaunchEventForm);
const CONFIG: LaunchEventConfig = {
  enabled: true,
  endpoint: 'https://script.google.com/macros/s/test-event/exec',
  campaignId: 'app-launch-2026',
  startAt: '2020-01-01T00:00:00+09:00',
  endAt: '2099-11-25T00:00:00+09:00',
};
const METADATA: LaunchEventMetadata = {
  eventId: 'app-launch-2026',
  schemaVersion: 1,
  accepting: true,
  startAt: CONFIG.startAt,
  endAt: CONFIG.endAt,
  rulesVersion: 'v1',
  privacy: {
    controller: '테스트 운영팀',
    contact: 'privacy@example.test',
    purpose: '응모 접수와 당첨 안내',
    items: ['회원 번호', '이름', '연락처', '사연', '선택 사진'],
    retentionDays: 30,
  },
};
const RECEIPT: LaunchEventReceipt = {
  eventId: 'app-launch-2026',
  submissionId: '12345678-1234-4234-9234-123456789012',
  receivedAt: '2026-11-11T12:00:00+09:00',
};
const originalShowModal = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal',
);
const originalClose = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close',
);

beforeAll(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.open = true;
      },
    },
    close: {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.open = false;
      },
    },
  });
});

afterAll(() => {
  for (const [property, descriptor] of [
    ['showModal', originalShowModal],
    ['close', originalClose],
  ] as const) {
    if (descriptor)
      Object.defineProperty(HTMLDialogElement.prototype, property, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, property);
  }
});

function setAuth(
  status: ReturnType<typeof useAuthSession>['status'],
  memberId: string | null = null,
) {
  authMock.mockReturnValue({
    status,
    memberId,
    member: null,
    errorMessage: null,
    authenticate: async () => undefined,
    updateProfile: async () => undefined,
    deleteAccount: async () => ({ status: 'deleted' }),
    completeAccountDeletion: () => undefined,
    logout: () => undefined,
    retry: () => undefined,
  });
}

beforeEach(() => {
  setAuth('guest');
  metadataMock.mockReset().mockResolvedValue(METADATA);
  submitMock.mockReset();
  clockMock.mockReset().mockReturnValue(new Date('2026-11-11T12:00:00+09:00'));
  formMock.mockReset().mockImplementation((props) => (
    <div data-testid="event-form">
      <span>회원 번호: {props.memberId}</span>
      <button type="button" onClick={() => props.onPendingChange?.(true)}>
        테스트 접수 시작
      </button>
      <button type="button" onClick={() => props.onSuccess(RECEIPT)}>
        테스트 접수 성공
      </button>
    </div>
  ));
});

function Location() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname + location.search}
    </output>
  );
}

function page(config: LaunchEventConfig) {
  return (
    <MemoryRouter initialEntries={['/events/app-launch']}>
      <LaunchEventRoute config={config} />
      <Location />
    </MemoryRouter>
  );
}

function setup(config = CONFIG) {
  return { user: userEvent.setup(), ...render(page(config)) };
}

async function readyButton() {
  return screen.findByRole('button', { name: '응모하기' });
}

describe('LaunchEventRoute 접수 게이트와 화면 전환', () => {
  it.each([
    ['비활성', { ...CONFIG, enabled: false }, '응모를 준비하고 있어요'],
    ['수신 주소 없음', { ...CONFIG, endpoint: '' }, '응모를 준비하고 있어요'],
    [
      '시작 전',
      { ...CONFIG, startAt: '2098-01-01T00:00:00+09:00' },
      '응모 시작 전이에요',
    ],
    [
      '마감',
      { ...CONFIG, endAt: '2026-11-11T12:00:00+09:00' },
      '응모가 마감되었어요',
    ],
  ])(
    '%s일 때 수신부 호출과 응모 진입을 차단한다',
    async (_label, config, label) => {
      const { user } = setup(config);
      const button = screen.getByRole('button', { name: label });
      expect(button).toBeDisabled();
      await user.click(button);
      expect(metadataMock).not.toHaveBeenCalled();
      expect(submitMock).not.toHaveBeenCalled();
      expect(formMock).not.toHaveBeenCalled();
    },
  );

  it('클라이언트 기간이 열려 있어도 수신부 확인 전에는 응모할 수 없다', () => {
    metadataMock.mockImplementation(() => new Promise(() => undefined));
    setup();
    expect(
      screen.getByRole('button', { name: '응모를 준비하고 있어요' }),
    ).toBeDisabled();
    expect(metadataMock).toHaveBeenCalledWith(CONFIG.endpoint);
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('수신부의 기간이 다르면 응모 버튼을 열지 않는다', async () => {
    metadataMock.mockResolvedValue({
      ...METADATA,
      endAt: '2099-11-24T00:00:00+09:00',
    });
    setup();
    await act(async () => undefined);
    expect(
      screen.getByRole('button', { name: '응모를 준비하고 있어요' }),
    ).toBeDisabled();
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('수신부 확인 실패를 안내하고 재확인 성공 시에만 응모를 연다', async () => {
    metadataMock.mockRejectedValueOnce(new Error('unavailable'));
    const { user } = setup();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '접수 정보를 불러오지 못했어요',
    );
    await user.click(screen.getByRole('button', { name: '다시 확인' }));
    expect(await readyButton()).toBeEnabled();
    expect(metadataMock).toHaveBeenCalledTimes(2);
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('비로그인 사용자는 로그인 안내를 받고 닫으면 응모 버튼으로 초점이 돌아온다', async () => {
    const { user } = setup();
    const button = await readyButton();
    await user.click(button);
    expect(
      screen.getByRole('dialog', { name: '로그인이 필요해요' }),
    ).toBeVisible();
    expect(formMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('로그인 이동에 이벤트 복귀 경로를 포함한다', async () => {
    const { user } = setup();
    await user.click(await readyButton());
    await user.click(screen.getByRole('button', { name: /^로그인$/ }));
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/login?returnTo=%2Fevents%2Fapp-launch',
    );
  });

  it('로그인 상태를 확인 중일 때는 응모를 시작하지 않는다', async () => {
    setAuth('loading');
    setup();
    expect(
      await screen.findByRole('button', { name: '로그인 확인 중…' }),
    ).toBeDisabled();
    expect(formMock).not.toHaveBeenCalled();
  });

  it('인증된 회원과 검증된 메타데이터로 폼을 열고 접수 중 뒤로가기를 막는다', async () => {
    setAuth('authenticated', '37');
    const { user } = setup();
    await user.click(await readyButton());
    expect(screen.getByTestId('event-form')).toHaveTextContent('회원 번호: 37');
    expect(
      screen.getByRole('heading', { level: 1, name: '응모하기' }),
    ).toHaveFocus();
    const props = formMock.mock.calls.at(-1)?.[0];
    expect(props).toMatchObject({
      memberId: '37',
      metadata: METADATA,
      endpoint: CONFIG.endpoint,
    });
    await user.click(screen.getByRole('button', { name: '테스트 접수 시작' }));
    expect(
      screen.getByRole('button', { name: '이벤트 상세로 돌아가기' }),
    ).toBeDisabled();
  });

  it('접수 도중 마감되어도 응답을 기다리며 성공 뒤에는 헤더 잠금을 해제한다', async () => {
    setAuth('authenticated', '37');
    const { user, rerender } = setup();
    await user.click(await readyButton());
    await user.click(screen.getByRole('button', { name: '테스트 접수 시작' }));
    clockMock.mockReturnValue(new Date(CONFIG.endAt));
    rerender(page(CONFIG));
    expect(screen.getByTestId('event-form')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '테스트 접수 성공' }));
    expect(
      screen.getByRole('heading', { name: '응모가 완료됐어요' }),
    ).toBeInTheDocument();
    expect(screen.getByText(RECEIPT.submissionId)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '응모 완료', level: 1 }),
    ).toHaveFocus();
    const back = screen.getByRole('button', { name: '홈으로 돌아가기' });
    expect(back).toBeEnabled();
    await user.click(back);
    expect(screen.getByTestId('location')).toHaveTextContent('/trade');
  });

  it('작성 중 인증이 해제되면 기존 회원의 폼을 제거한다', async () => {
    setAuth('authenticated', '37');
    const { user, rerender } = setup();
    await user.click(await readyButton());
    setAuth('guest');
    rerender(page(CONFIG));
    expect(screen.queryByTestId('event-form')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: '응모 가능 상태를 다시 확인해 주세요',
      }),
    ).toBeInTheDocument();
  });

  it('배타적 마감 직전 분을 표시한다', async () => {
    setup();
    await waitFor(() => expect(metadataMock).toHaveBeenCalled());
    expect(screen.getByText(/한국 시간/)).toHaveTextContent('11. 24. 23:59');
  });
});
