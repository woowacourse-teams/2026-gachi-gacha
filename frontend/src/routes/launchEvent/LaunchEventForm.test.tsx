import {
  afterAll,
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

import type { LaunchEventMetadata } from '@/features/launchEvent/launchEventConfig';
import {
  type LaunchEventReceipt,
  submitLaunchEvent,
} from '@/features/launchEvent/launchEventSubmission';

import { LaunchEventForm } from './LaunchEventForm';

jest.mock('@/features/launchEvent/launchEventSubmission', () => ({
  submitLaunchEvent: jest.fn(),
}));

const submitMock = jest.mocked(submitLaunchEvent);
const ENDPOINT = 'https://script.google.com/macros/s/event-test/exec';
const UUID = '12345678-1234-4234-9234-123456789012';
const NEXT_UUID = '12345678-1234-4234-9234-123456789013';
const METADATA: LaunchEventMetadata = {
  eventId: 'app-launch-2026',
  schemaVersion: 1,
  accepting: true,
  startAt: '2020-01-01T00:00:00+09:00',
  endAt: '2099-11-24T23:59:59+09:00',
  rulesVersion: 'event-rules-v1',
  privacy: {
    controller: '테스트 운영팀',
    contact: 'privacy@example.test',
    purpose: '응모 접수 및 당첨 안내',
    items: ['회원 번호', '이름', '연락처', '응모 사연', '선택한 사진'],
    retentionDays: 17,
  },
};
const RECEIPT: LaunchEventReceipt = {
  eventId: 'app-launch-2026',
  submissionId: UUID,
  receivedAt: '2026-11-11T12:00:00+09:00',
};
const uuidMock = jest.fn<typeof crypto.randomUUID>();
const originalUuid = Object.getOwnPropertyDescriptor(crypto, 'randomUUID');
const originalCreate = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
const originalRevoke = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
const originalShowModal = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal',
);
const originalClose = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close',
);
const createUrl = jest.fn<(file: Blob) => string>();
const revokeUrl = jest.fn<(url: string) => void>();

beforeAll(() => {
  Object.defineProperty(crypto, 'randomUUID', {
    configurable: true,
    value: uuidMock,
  });
  Object.defineProperties(URL, {
    createObjectURL: { configurable: true, value: createUrl },
    revokeObjectURL: { configurable: true, value: revokeUrl },
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
    [URL, 'createObjectURL', originalCreate],
    [URL, 'revokeObjectURL', originalRevoke],
    [HTMLDialogElement.prototype, 'showModal', originalShowModal],
    [HTMLDialogElement.prototype, 'close', originalClose],
  ] as const) {
    if (descriptor) Object.defineProperty(target, property, descriptor);
    else Reflect.deleteProperty(target, property);
  }
});

beforeEach(() => {
  submitMock.mockReset();
  submitMock.mockResolvedValue(RECEIPT);
  uuidMock.mockReset().mockReturnValue(UUID);
  let count = 0;
  createUrl.mockReset().mockImplementation(() => `blob:event-photo-${++count}`);
  revokeUrl.mockReset();
});

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
    target: { value: '가치' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: '연락처' }), {
    target: { value: '010-1234-5678' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: '응모 사연' }), {
    target: { value: '가챠를 좋아해서 응모합니다.' },
  });
  fireEvent.click(screen.getByRole('checkbox', { name: '전체 동의' }));
}

describe('LaunchEventForm', () => {
  it('실제 접수 응답 이후에만 완료를 알리고 회원·정책·정규화한 입력을 전송한다', async () => {
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
    expect(screen.getByRole('button', { name: '응모하기' })).toBeDisabled();
    fill();
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));
    expect(submitMock).toHaveBeenCalledWith(
      {
        submissionId: UUID,
        memberId: '37',
        name: '가치',
        phone: '01012345678',
        reason: '가챠를 좋아해서 응모합니다.',
        privacyConsent: true,
        rulesConsent: true,
        rulesVersion: 'event-rules-v1',
        photos: [],
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
  });

  it('응답 실패 시 입력을 유지하고 같은 내용 재시도는 같은 응모 번호를 쓴다', async () => {
    submitMock.mockRejectedValueOnce(new Error('upstream failure'));
    uuidMock.mockReturnValueOnce(UUID).mockReturnValue(NEXT_UUID);
    const { onSuccess } = setup();
    fill();
    fireEvent.click(screen.getByRole('button', { name: '응모하기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '접수 결과를 확인하지 못했어요',
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: '연락처' })).toHaveValue(
      '010-1234-5678',
    );
    fireEvent.click(screen.getByRole('button', { name: '응모하기' }));
    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(2));
    expect(submitMock.mock.calls[0]?.[0].submissionId).toBe(UUID);
    expect(submitMock.mock.calls[1]?.[0].submissionId).toBe(UUID);
    expect(uuidMock).toHaveBeenCalledTimes(1);
  });

  it('실패한 입력 내용을 변경하면 새 응모 번호를 만든다', async () => {
    submitMock.mockRejectedValue(new Error('failure'));
    uuidMock.mockReturnValueOnce(UUID).mockReturnValue(NEXT_UUID);
    setup();
    fill();
    fireEvent.click(screen.getByRole('button', { name: '응모하기' }));
    await screen.findByRole('alert');
    fireEvent.change(screen.getByRole('textbox', { name: '이름' }), {
      target: { value: '다른 이름' },
    });
    fireEvent.click(screen.getByRole('button', { name: '응모하기' }));
    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(2));
    expect(submitMock.mock.calls[1]?.[0].submissionId).toBe(NEXT_UUID);
  });

  it('잘못된 연락처·짧은 사연·필수 동의 누락은 제출하지 않는다', () => {
    setup();
    fill();
    fireEvent.change(screen.getByRole('textbox', { name: '연락처' }), {
      target: { value: '0101234567' },
    });
    fireEvent.blur(screen.getByRole('textbox', { name: '연락처' }));
    expect(screen.getByText(/휴대전화 번호를 10~11자리/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: '응모 사연' }), {
      target: { value: '짧음' },
    });
    fireEvent.blur(screen.getByRole('textbox', { name: '응모 사연' }));
    expect(screen.getByText(/앞뒤 공백을 제외하고/)).toBeInTheDocument();
    fireEvent.submit(screen.getByRole('form'));
    expect(submitMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '응모하기' })).toBeDisabled();
  });

  it('열어 둔 폼의 기간이 끝났거나 접수가 중단되면 전송하지 않는다', async () => {
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
    expect(submitMock).not.toHaveBeenCalled();
    rerender(
      <LaunchEventForm
        {...props}
        metadata={{ ...METADATA, accepting: false }}
      />,
    );
    fireEvent.submit(screen.getByRole('form'));
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('사연 Enter는 줄바꿈을 유지하고 입력값을 웹 저장소에 기록하지 않는다', async () => {
    const storage = jest.spyOn(Storage.prototype, 'setItem');
    const user = userEvent.setup();
    const { unmount } = setup();
    await user.type(
      screen.getByRole('textbox', { name: '응모 사연' }),
      '첫 문장{Enter}둘째 문장',
    );
    expect(screen.getByRole('textbox', { name: '응모 사연' })).toHaveValue(
      '첫 문장\n둘째 문장',
    );
    expect(submitMock).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
    const beforeUnload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(beforeUnload);
    expect(beforeUnload.defaultPrevented).toBe(true);
    unmount();
    const afterUnmount = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(afterUnmount);
    expect(afterUnmount.defaultPrevented).toBe(false);
    storage.mockRestore();
  });

  it('사진 형식·크기·개수를 제한하고 삭제/이탈 시 미리보기를 정리한다', async () => {
    const { unmount } = setup();
    const input = screen.getByLabelText('인증 사진 파일 선택');
    fireEvent.change(input, {
      target: {
        files: [new File(['x'], 'bad.svg', { type: 'image/svg+xml' })],
      },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('JPG, PNG, WebP');
    const tooLarge = new File(['x'], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(tooLarge, 'size', { value: 5 * 1024 * 1024 + 1 });
    fireEvent.change(input, { target: { files: [tooLarge] } });
    expect(createUrl).not.toHaveBeenCalled();
    const files = [1, 2, 3].map(
      (number) => new File(['photo'], `${number}.png`, { type: 'image/png' }),
    );
    fireEvent.change(input, { target: { files } });
    expect(screen.getAllByRole('img')).toHaveLength(3);
    expect(
      screen.getByRole('button', { name: '사진 추가 (3/3)' }),
    ).toBeDisabled();
    fireEvent.change(input, { target: { files: [files[0]] } });
    expect(screen.getByRole('alert')).toHaveTextContent('최대 3장');
    fireEvent.click(screen.getByRole('button', { name: '인증 사진 1 삭제' }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: '사진 추가 (2/3)' }),
      ).toHaveFocus(),
    );
    expect(revokeUrl).toHaveBeenCalledWith('blob:event-photo-1');
    unmount();
    expect(revokeUrl).toHaveBeenCalledWith('blob:event-photo-2');
    expect(revokeUrl).toHaveBeenCalledWith('blob:event-photo-3');
    expect(revokeUrl).toHaveBeenCalledTimes(3);
  });

  it('선택 사진을 base64로 변환해 제출한다', async () => {
    // 테스트 전역 File은 MSW를 위한 Node File이므로 jsdom FileReader와 호환되지 않는다.
    const read = jest
      .spyOn(FileReader.prototype, 'readAsDataURL')
      .mockImplementation(function (this: FileReader, file: Blob) {
        void file.arrayBuffer().then((buffer) => {
          Object.defineProperty(this, 'result', {
            configurable: true,
            value: `data:${file.type};base64,${btoa(String.fromCharCode(...new Uint8Array(buffer)))}`,
          });
          this.dispatchEvent(new ProgressEvent('load'));
        });
      });
    setup();
    fill();
    fireEvent.change(screen.getByLabelText('인증 사진 파일 선택'), {
      target: {
        files: [new File(['photo'], 'proof.png', { type: 'image/png' })],
      },
    });
    fireEvent.click(screen.getByRole('button', { name: '응모하기' }));
    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));
    expect(submitMock.mock.calls[0]?.[0].photos).toEqual([
      { name: 'proof.png', mimeType: 'image/png', data: btoa('photo') },
    ]);
    read.mockRestore();
  });

  it('운영 설정의 개인정보 문구를 보여 주고 모달을 닫으면 원래 버튼으로 복귀한다', async () => {
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
      screen.getByText('개인정보 처리자: 테스트 운영팀'),
    ).toBeInTheDocument();
    expect(screen.getByText(/접수일로부터 17일/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '확인' }));
    expect(opener).toHaveFocus();
    await user.click(opener);
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { cancelable: true }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    fireEvent.click(
      screen.getByRole('checkbox', { name: /개인정보 수집·이용 동의/ }),
    );
    expect(
      screen.getByRole('checkbox', { name: '전체 동의' }),
    ).toBePartiallyChecked();
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
