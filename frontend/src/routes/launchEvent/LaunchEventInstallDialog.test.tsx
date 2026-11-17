import { useState } from 'react';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LaunchEventInstallDialog } from './LaunchEventInstallDialog';

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

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        앱에서 응모하기
      </button>
      {open && <LaunchEventInstallDialog onClose={() => setOpen(false)} />}
    </>
  );
}

async function openDialog() {
  const user = userEvent.setup();
  const result = render(<Harness />);
  const opener = screen.getByRole('button', { name: '앱에서 응모하기' });
  await user.click(opener);
  return { user, opener, ...result };
}

describe('LaunchEventInstallDialog', () => {
  it('직접 누르기 전에는 열지 않고, 열 때 제목에 초점을 둔다', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '앱에서 응모하기' }));
    expect(
      screen.getByRole('dialog', { name: '가치가챠 앱에서 참여해 주세요' }),
    ).toHaveAccessibleDescription(
      '이번 이벤트는 가치가챠 앱에서 응모할 수 있어요. 앱 설치 후 로그인하고, 홈의 이벤트 배너에서 응모를 완료해 주세요.',
    );
    expect(
      screen.getByRole('heading', { name: '가치가챠 앱에서 참여해 주세요' }),
    ).toHaveFocus();
  });

  it('공식 배지와 HTTPS 스토어 링크를 Apple 먼저 제공하며 자동으로 이동하지 않는다', async () => {
    const currentLocation = window.location.href;
    await openDialog();
    const [apple, google] = screen.getAllByRole('link');
    expect(apple).toHaveAttribute(
      'href',
      'https://apps.apple.com/kr/app/가치가챠/id6830106803',
    );
    expect(google).toHaveAttribute(
      'href',
      'https://play.google.com/store/apps/details?id=com.gachigacha.app&pcampaignid=web_share',
    );
    for (const link of [apple, google]) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
    expect(screen.getByAltText('App Store에서 다운로드')).toHaveAttribute(
      'height',
      '40',
    );
    expect(screen.getByAltText('Google Play에서 다운로드')).toHaveAttribute(
      'height',
      '40',
    );
    expect(window.location.href).toBe(currentLocation);
  });

  it('닫기는 제목 옆에, 설치 안내는 하단 스토어 배지보다 앞에 제공한다', async () => {
    await openDialog();
    const dialog = screen.getByRole('dialog');
    const close = screen.getByRole('button', { name: '닫기' });
    const title = screen.getByRole('heading');
    const hint = screen.getByText('이미 설치했다면 가치가챠 앱을 열어 주세요.');
    const [apple, google] = screen.getAllByRole('link');
    expect(close.parentElement).toBe(title.parentElement);
    expect(close.textContent).toBe('');
    expect(close.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(hint.compareDocumentPosition(apple!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(dialog.lastElementChild).toBe(apple!.parentElement);
    expect(dialog.lastElementChild).toContainElement(google!);
  });

  it('이름이 제공된 X 버튼으로 닫으면 연 버튼에 초점을 돌려준다', async () => {
    const { user, opener } = await openDialog();
    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('Escape의 native cancel 이벤트로 닫으면 연 버튼에 초점을 돌려준다', async () => {
    const { opener } = await openDialog();
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { cancelable: true, bubbles: false }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
