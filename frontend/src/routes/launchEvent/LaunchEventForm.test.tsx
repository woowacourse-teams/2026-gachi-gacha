import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { collectLaunchEventParticipation } from '@/features/launchEvent/collectLaunchEventParticipation';
import {
  LAUNCH_EVENT_SCHEMA_VERSION,
  type LaunchEventMetadata,
} from '@/features/launchEvent/launchEventConfig';
import {
  type LaunchEventReceipt,
  submitLaunchEvent,
} from '@/features/launchEvent/launchEventSubmission';

import { LaunchEventForm } from './LaunchEventForm';

jest.mock('@/features/launchEvent/collectLaunchEventParticipation', () => ({
  collectLaunchEventParticipation: jest.fn(),
}));
jest.mock('@/features/launchEvent/launchEventSubmission', () => ({
  ...jest.requireActual<
    typeof import('@/features/launchEvent/launchEventSubmission')
  >('@/features/launchEvent/launchEventSubmission'),
  submitLaunchEvent: jest.fn(),
}));

const collectMock = jest.mocked(collectLaunchEventParticipation);
const submitMock = jest.mocked(submitLaunchEvent);
const ENDPOINT = 'https://script.google.com/macros/s/test/exec';
const UUID = '12345678-1234-4234-9234-123456789012';
const NEXT_UUID = '12345678-1234-4234-9234-123456789013';
const METADATA: LaunchEventMetadata = {
  eventId: 'app-launch-2026',
  schemaVersion: LAUNCH_EVENT_SCHEMA_VERSION,
  authentication: 'client-reported',
  capabilities: { participationPlatform: true, appOnlyParticipation: true },
  accepting: true,
  startAt: '2020-01-01T00:00:00+09:00',
  endAt: '2099-11-24T23:59:59+09:00',
  rulesVersion: 'event-rules-v2',
  privacy: {
    controller: '테스트 운영팀',
    contact: 'privacy@example.test',
    purpose: '응모 접수 및 당첨 안내',
    items: ['회원 번호', '이름', '인스타그램 아이디', '작성한 게시글 번호'],
    retentionDays: 17,
  },
};
const RECEIPT: LaunchEventReceipt = {
  eventId: 'app-launch-2026',
  submissionId: UUID,
  receivedAt: '2026-11-11T12:00:00+09:00',
};
const PARTICIPATION = { memberId: '37', tradeIds: [10, 19] };
const uuidMock = jest.fn<typeof crypto.randomUUID>();
const originalUuid = Object.getOwnPropertyDescriptor(crypto, 'randomUUID');
const originalShowModal = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal',
);
const originalClose = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close',
);
const originalNativePlatform =
  document.documentElement.dataset.gachigachaNativePlatform;
const originalNativeBridge = Object.getOwnPropertyDescriptor(
  window,
  'ReactNativeWebView',
);

beforeAll(() => {
  Object.defineProperty(crypto, 'randomUUID', {
    configurable: true,
    value: uuidMock,
  });
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
  for (const [target, property, descriptor] of [
    [crypto, 'randomUUID', originalUuid],
    [HTMLDialogElement.prototype, 'showModal', originalShowModal],
    [HTMLDialogElement.prototype, 'close', originalClose],
  ] as const) {
    if (descriptor) Object.defineProperty(target, property, descriptor);
    else Reflect.deleteProperty(target, property);
  }
});

beforeEach(() => {
  document.documentElement.dataset.gachigachaNativePlatform = 'android';
  collectMock.mockReset().mockResolvedValue(PARTICIPATION);
  submitMock.mockReset().mockResolvedValue(RECEIPT);
  uuidMock.mockReset().mockReturnValue(UUID);
});

afterEach(() => {
  if (originalNativePlatform === undefined)
    delete document.documentElement.dataset.gachigachaNativePlatform;
  else
    document.documentElement.dataset.gachigachaNativePlatform =
      originalNativePlatform;
  if (originalNativeBridge)
    Object.defineProperty(window, 'ReactNativeWebView', originalNativeBridge);
  else Reflect.deleteProperty(window, 'ReactNativeWebView');
  jest.restoreAllMocks();
});

function changeToNonAppPlatform(platform: 'web' | 'app-unknown') {
  delete document.documentElement.dataset.gachigachaNativePlatform;
  Reflect.deleteProperty(window, 'ReactNativeWebView');
  if (platform === 'app-unknown') {
    window.ReactNativeWebView = { postMessage: jest.fn() };
    jest
      .spyOn(navigator, 'userAgent', 'get')
      .mockReturnValue('Unknown WebView');
    jest.spyOn(navigator, 'platform', 'get').mockReturnValue('Unknown');
  }
}

function setup(metadata = METADATA) {
  const onSuccess = jest.fn<(receipt: LaunchEventReceipt) => void>();
  const onPendingChange = jest.fn<(pending: boolean) => void>();
  const onDirtyChange = jest.fn<(dirty: boolean) => void>();
  const props = {
    metadata,
    memberId: '37',
    endpoint: ENDPOINT,
    onSuccess,
    onBack: jest.fn(),
    onPendingChange,
    onDirtyChange,
  };
  return {
    ...render(<LaunchEventForm {...props} />),
    props,
    onSuccess,
    onPendingChange,
    onDirtyChange,
  };
}

function fill() {
  fireEvent.change(screen.getByRole('textbox', { name: '이름' }), {
    target: { value: '  가치  ' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: '인스타그램 아이디' }), {
    target: { value: ' @Gachi.Gacha_1 ' },
  });
  fireEvent.click(screen.getByRole('checkbox', { name: '전체 동의' }));
}

describe('LaunchEventForm', () => {
  it.each(['android', 'ios'] as const)(
    '앱 전용 접수 수신부에 %s 참여 환경을 전송한다',
    async (platform) => {
      document.documentElement.dataset.gachigachaNativePlatform = platform;
      setup();
      fill();
      fireEvent.click(screen.getByRole('button', { name: '응모하기' }));
      await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));
      expect(submitMock.mock.calls[0]?.[0]).toHaveProperty(
        'participationPlatform',
        platform,
      );
    },
  );

  it.each([undefined, { participationPlatform: true as const }])(
    '앱 전용 접수를 지원하지 않는 수신부에는 제출하지 않는다: %j',
    async (capabilities) => {
      const metadata = { ...METADATA };
      if (capabilities) metadata.capabilities = capabilities;
      else delete metadata.capabilities;
      setup(metadata);
      fill();
      fireEvent.submit(screen.getByRole('form'));
      expect(await screen.findByRole('alert')).toHaveTextContent(
        '지금은 응모할 수 없어요',
      );
      expect(collectMock).not.toHaveBeenCalled();
      expect(submitMock).not.toHaveBeenCalled();
    },
  );

  it.each(['web', 'app-unknown'] as const)(
    '폼을 직접 연 %s 환경에서도 최종 제출 시 조회·전송을 막는다',
    async (platform) => {
      changeToNonAppPlatform(platform);
      const { onSuccess } = setup();
      fill();
      fireEvent.submit(screen.getByRole('form'));
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('가치가챠 앱에서 이벤트를 다시 열고');
      expect(alert).toHaveFocus();
      expect(screen.getByRole('textbox', { name: '이름' })).toHaveValue(
        '  가치  ',
      );
      expect(collectMock).not.toHaveBeenCalled();
      expect(submitMock).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    },
  );

  it.each(['web', 'app-unknown'] as const)(
    '활동 조회 중 %s 환경으로 바뀌면 최종 전송을 막고 입력을 유지한다',
    async (platform) => {
      let complete!: (value: typeof PARTICIPATION) => void;
      collectMock.mockReturnValue(
        new Promise((resolve) => {
          complete = resolve;
        }),
      );
      const { onSuccess, onPendingChange } = setup();
      fill();
      fireEvent.submit(screen.getByRole('form'));
      expect(collectMock).toHaveBeenCalledTimes(1);
      expect(onPendingChange).toHaveBeenLastCalledWith(true);
      changeToNonAppPlatform(platform);
      await act(async () => complete(PARTICIPATION));
      expect(await screen.findByRole('alert')).toHaveTextContent(
        '입력한 정보는 전송하지 않았어요',
      );
      expect(screen.getByRole('textbox', { name: '이름' })).toHaveValue(
        '  가치  ',
      );
      expect(submitMock).not.toHaveBeenCalled();
      expect(uuidMock).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onPendingChange).toHaveBeenLastCalledWith(false);
    },
  );

  it('이름·인스타그램만 입력받고 조회된 활동과 정규화한 입력을 한 번 전송한다', async () => {
    let complete!: (value: LaunchEventReceipt) => void;
    submitMock.mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    const { onSuccess, onPendingChange, onDirtyChange } = setup();
    const form = screen.getByRole('form', { name: '가치가챠 이벤트 응모' });
    expect(form).toHaveClass('ph-no-capture', 'ph-mask');
    expect(form).toHaveAttribute('data-sentry-mask');
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    expect(
      screen.queryByLabelText('인증 사진 파일 선택'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '응모하기' })).toBeDisabled();
    fill();
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));
    expect(collectMock).toHaveBeenCalledTimes(1);
    expect(collectMock).toHaveBeenCalledWith('37');
    expect(submitMock).toHaveBeenCalledWith(
      {
        submissionId: UUID,
        memberId: '37',
        name: '가치',
        instagramId: 'gachi.gacha_1',
        tradeIds: [10, 19],
        privacyConsent: true,
        rulesConsent: true,
        rulesVersion: 'event-rules-v2',
        participationPlatform: 'android',
      },
      ENDPOINT,
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: '이름' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: '접수 확인 중…' }),
    ).toBeDisabled();
    expect(onPendingChange).toHaveBeenLastCalledWith(true);
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    await act(async () => complete(RECEIPT));
    expect(onSuccess).toHaveBeenCalledWith(RECEIPT);
    expect(onPendingChange).toHaveBeenLastCalledWith(false);
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('textbox', { name: '이름' })).toHaveValue('');
    expect(
      screen.getByRole('textbox', { name: '인스타그램 아이디' }),
    ).toHaveValue('');
    expect(
      screen.getByRole('checkbox', { name: '전체 동의' }),
    ).not.toBeChecked();
  });

  it('응답 실패 시 입력을 유지하고 같은 활동·내용 재시도는 같은 응모 번호를 쓴다', async () => {
    submitMock.mockRejectedValueOnce(new Error('upstream failure'));
    uuidMock.mockReturnValueOnce(UUID).mockReturnValue(NEXT_UUID);
    const { onSuccess } = setup();
    fill();
    fireEvent.click(screen.getByRole('button', { name: '응모하기' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('접수 결과를 확인하지 못했어요');
    expect(alert).toHaveFocus();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(
      screen.getByRole('textbox', { name: '인스타그램 아이디' }),
    ).toHaveValue(' @Gachi.Gacha_1 ');
    fireEvent.click(screen.getByRole('button', { name: '응모하기' }));
    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(2));
    expect(collectMock).toHaveBeenCalledTimes(2);
    expect(submitMock.mock.calls[0]?.[0].submissionId).toBe(UUID);
    expect(submitMock.mock.calls[1]?.[0].submissionId).toBe(UUID);
    expect(uuidMock).toHaveBeenCalledTimes(1);
  });

  it.each(['name', 'instagramId', 'tradeIds', 'rulesVersion'] as const)(
    '실패 뒤 %s 값이 달라지면 새 응모 번호를 만든다',
    async (field) => {
      submitMock.mockRejectedValue(new Error('failure'));
      uuidMock.mockReturnValueOnce(UUID).mockReturnValue(NEXT_UUID);
      const { rerender, props } = setup();
      fill();
      fireEvent.click(screen.getByRole('button', { name: '응모하기' }));
      await screen.findByRole('alert');
      if (field === 'tradeIds') {
        collectMock.mockResolvedValue({
          memberId: '37',
          tradeIds: [10, 19, 28],
        });
      } else if (field === 'rulesVersion') {
        rerender(
          <LaunchEventForm
            {...props}
            metadata={{ ...METADATA, rulesVersion: 'event-rules-v3' }}
          />,
        );
      } else {
        fireEvent.change(
          screen.getByRole('textbox', {
            name: field === 'name' ? '이름' : '인스타그램 아이디',
          }),
          {
            target: { value: field === 'name' ? '다른 이름' : 'other_account' },
          },
        );
      }
      fireEvent.click(screen.getByRole('button', { name: '응모하기' }));
      await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(2));
      expect(submitMock.mock.calls[1]?.[0].submissionId).toBe(NEXT_UUID);
    },
  );

  it.each([
    '',
    'https://instagram.com/example',
    'has space',
    '@@example',
    '한글',
    'a'.repeat(31),
  ])('올바르지 않은 인스타그램 아이디 %s는 조회·제출하지 않는다', (value) => {
    setup();
    fill();
    const input = screen.getByRole('textbox', { name: '인스타그램 아이디' });
    fireEvent.change(input, { target: { value } });
    fireEvent.blur(input);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/영문·숫자·밑줄·마침표로/)).toBeInTheDocument();
    fireEvent.submit(screen.getByRole('form'));
    expect(collectMock).not.toHaveBeenCalled();
    expect(submitMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '응모하기' })).toBeDisabled();
  });

  it('이름 길이와 필수 동의를 검증한다', () => {
    setup();
    fill();
    for (const value of ['   ', '가'.repeat(81)]) {
      fireEvent.change(screen.getByRole('textbox', { name: '이름' }), {
        target: { value },
      });
      fireEvent.submit(screen.getByRole('form'));
      expect(
        screen.getByText('이름을 1~80자로 입력해 주세요.'),
      ).toBeInTheDocument();
    }
    fireEvent.change(screen.getByRole('textbox', { name: '이름' }), {
      target: { value: '가치' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /개인정보 수집·이용 동의/ }),
    );
    fireEvent.submit(screen.getByRole('form'));
    expect(collectMock).not.toHaveBeenCalled();
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('참여 조회 실패 시 입력을 유지하고 외부 수신부에 보내지 않는다', async () => {
    collectMock.mockRejectedValue(new Error('secret upstream details'));
    const { onSuccess, onPendingChange } = setup();
    fill();
    fireEvent.click(screen.getByRole('button', { name: '응모하기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '로그인 상태와 게시글 참여 활동을 확인하지 못했어요',
    );
    expect(
      screen.queryByText('secret upstream details'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '이름' })).toHaveValue(
      '  가치  ',
    );
    expect(
      screen.getByRole('textbox', { name: '인스타그램 아이디' }),
    ).toHaveValue(' @Gachi.Gacha_1 ');
    expect(submitMock).not.toHaveBeenCalled();
    expect(uuidMock).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onPendingChange).toHaveBeenLastCalledWith(false);
  });

  it('게시글이 없으면 작성 후 응모하도록 안내하고 전송하지 않는다', async () => {
    collectMock.mockResolvedValue({ memberId: '37', tradeIds: [] });
    setup();
    fill();
    fireEvent.click(screen.getByRole('button', { name: '응모하기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '게시글을 1개 이상 작성한 뒤',
    );
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('열어 둔 폼의 기간이 끝났거나 접수가 중단되면 조회·전송하지 않는다', async () => {
    const { rerender, props } = setup();
    fill();
    rerender(
      <LaunchEventForm
        {...props}
        metadata={{ ...METADATA, endAt: '2021-11-24T23:59:59+09:00' }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '응모하기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '지금은 응모할 수 없어요',
    );
    rerender(
      <LaunchEventForm
        {...props}
        metadata={{ ...METADATA, accepting: false }}
      />,
    );
    fireEvent.submit(screen.getByRole('form'));
    expect(collectMock).not.toHaveBeenCalled();
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('활동 조회 중 응모 기간이 끝나면 입력 정보를 전송하지 않는다', async () => {
    const now = jest
      .spyOn(Date, 'now')
      .mockReturnValue(Date.parse('2026-11-20T12:00:00+09:00'));
    collectMock.mockImplementation(async () => {
      now.mockReturnValue(Date.parse('2026-11-25T00:00:00+09:00'));
      return PARTICIPATION;
    });
    setup({ ...METADATA, endAt: '2026-11-25T00:00:00+09:00' });
    fill();
    fireEvent.click(screen.getByRole('button', { name: '응모하기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '응모 기간이 종료되었어요',
    );
    expect(submitMock).not.toHaveBeenCalled();
    now.mockRestore();
  });

  it('입력은 웹 저장소에 남기지 않고 이탈 후 다시 열면 초기화한다', () => {
    const storage = jest.spyOn(Storage.prototype, 'setItem');
    const { unmount } = setup();
    fill();
    expect(storage).not.toHaveBeenCalled();
    const beforeUnload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(beforeUnload);
    expect(beforeUnload.defaultPrevented).toBe(true);
    unmount();
    const afterUnmount = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(afterUnmount);
    expect(afterUnmount.defaultPrevented).toBe(false);
    setup();
    expect(screen.getByRole('textbox', { name: '이름' })).toHaveValue('');
    expect(
      screen.getByRole('textbox', { name: '인스타그램 아이디' }),
    ).toHaveValue('');
    expect(
      screen.getByRole('checkbox', { name: '전체 동의' }),
    ).not.toBeChecked();
    storage.mockRestore();
  });

  it('수집·보유·활동 조건을 표시하고 모달을 닫으면 원래 버튼으로 복귀한다', async () => {
    const user = userEvent.setup();
    setup();
    const opener = screen.getByRole('button', {
      name: '개인정보 수집·이용 내용 보기',
    });
    await user.click(opener);
    expect(
      screen.getByRole('dialog', { name: '개인정보 수집·이용 동의' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /회원 번호, 이름, 인스타그램 아이디, 작성한 게시글 번호/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/이벤트 종료 후 17일/)).toBeInTheDocument();
    expect(
      screen.getByText(/경품 전달 완료 후 지체 없이 삭제하며/),
    ).toHaveTextContent('최대 이벤트 종료 후 17일까지 보관해요.');
    expect(screen.getByText(/동의를 거부할 수 있지만/)).toHaveTextContent(
      '다른 서비스 기능 이용에는 영향을 주지 않아요.',
    );
    expect(
      screen.getByText(/응모 정보는 Google 스프레드시트에 저장해요/),
    ).toHaveTextContent('처리위탁·국외 이전');
    const policyLink = screen.getByRole('link', {
      name: '개인정보처리방침(새 창)',
    });
    expect(policyLink).toHaveAttribute('href', '/privacy');
    expect(policyLink).toHaveAttribute('target', '_blank');
    expect(policyLink).toHaveAttribute('rel', 'noreferrer');
    expect(screen.getByText(/개인정보 처리자:/)).toHaveTextContent(
      METADATA.privacy.controller,
    );
    expect(screen.getByText(/문의:/)).toHaveTextContent(
      METADATA.privacy.contact,
    );
    expect(screen.getByText(/이용 목적:/)).toHaveTextContent(
      METADATA.privacy.purpose,
    );
    expect(screen.queryByText(METADATA.rulesVersion)).not.toBeInTheDocument();
    expect(screen.queryByText(/첨부 사진/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '확인' }));
    expect(opener).toHaveFocus();
    await user.click(
      screen.getByRole('button', { name: '참여 조건·유의사항 보기' }),
    );
    expect(
      screen.getByText(/게시글 참여 활동을 추첨에 반영해요/),
    ).toHaveTextContent(
      '재응모는 횟수가 아니라 마지막 응모 시점의 활동으로 갱신돼요.',
    );
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { cancelable: true }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('checkbox', { name: /개인정보 수집·이용 동의/ }),
    );
    expect(
      screen.getByRole('checkbox', { name: '전체 동의' }),
    ).toBePartiallyChecked();
  });

  it('활동 조회 중 이탈하면 조회 완료 뒤에도 응모하지 않는다', async () => {
    let complete!: (value: typeof PARTICIPATION) => void;
    collectMock.mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    const { unmount, onSuccess, onPendingChange } = setup();
    fill();
    fireEvent.click(screen.getByRole('button', { name: '응모하기' }));
    expect(onPendingChange).toHaveBeenLastCalledWith(true);
    unmount();
    expect(onPendingChange).toHaveBeenLastCalledWith(false);
    await act(async () => complete(PARTICIPATION));
    expect(submitMock).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('인증 만료로 폼이 사라질 때 최신 콜백으로 부모의 접수 잠금을 해제한다', async () => {
    let fail!: (error: Error) => void;
    collectMock.mockReturnValue(
      new Promise((_, reject) => {
        fail = reject;
      }),
    );
    const { unmount, rerender, props, onPendingChange } = setup();
    fill();
    fireEvent.click(screen.getByRole('button', { name: '응모하기' }));
    expect(onPendingChange).toHaveBeenLastCalledWith(true);
    const nextPendingChange = jest.fn<(pending: boolean) => void>();
    rerender(
      <LaunchEventForm {...props} onPendingChange={nextPendingChange} />,
    );
    expect(onPendingChange).toHaveBeenLastCalledWith(true);
    expect(nextPendingChange).toHaveBeenLastCalledWith(true);
    unmount();
    expect(nextPendingChange).toHaveBeenLastCalledWith(false);
    await act(async () => fail(new Error('SESSION_CHANGED')));
    expect(nextPendingChange).toHaveBeenLastCalledWith(false);
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('이탈 후 늦게 받은 접수 결과로 완료 화면을 열지 않는다', async () => {
    let complete!: (value: LaunchEventReceipt) => void;
    submitMock.mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    const { unmount, onSuccess } = setup();
    fill();
    fireEvent.click(screen.getByRole('button', { name: '응모하기' }));
    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));
    unmount();
    await act(async () => complete(RECEIPT));
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
