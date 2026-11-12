import type { PropsWithChildren, ReactElement } from 'react';
import {
  afterEach,
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
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import { MemberBlockProvider } from '@/features/memberSafety/MemberBlockContext';

import ChatRoomPanel from './ChatRoomPanel';
import * as chatDate from '../../model/chatDate';
import { SELECTED_CHAT_ROOM } from '../../storybook/chatMocks';

function renderPanel(panel: ReactElement) {
  return render(panel, {
    wrapper: ({ children }: PropsWithChildren) => (
      <MemoryRouter>
        <AuthSessionProvider initialAccessToken={null}>
          <MemberBlockProvider>{children}</MemberBlockProvider>
        </AuthSessionProvider>
      </MemoryRouter>
    ),
  });
}

describe('ChatRoomPanel', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: jest.fn((file: File) => `blob:${file.name}`),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('입력 상태는 갱신하되 변경 없는 메시지 목록의 계산은 반복하지 않는다', () => {
    const formatDateLabel = jest.spyOn(chatDate, 'formatChatDateLabel');
    renderPanel(
      <ChatRoomPanel room={SELECTED_CHAT_ROOM} socketStatus="connected" />,
    );

    expect(formatDateLabel).toHaveBeenCalled();
    formatDateLabel.mockClear();
    expect(screen.getByRole('button', { name: '보내기' })).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox', { name: '메시지' }), {
      target: { value: 'a' },
    });

    expect(screen.getByRole('textbox', { name: '메시지' })).toHaveValue('a');
    expect(screen.getByRole('button', { name: '보내기' })).toBeEnabled();
    expect(formatDateLabel).not.toHaveBeenCalled();
  });

  it('날짜가 바뀐 후 입력하면 같은 메시지 목록의 오늘 표시를 어제로 갱신한다', () => {
    jest.useFakeTimers({ now: new Date(2026, 10, 9, 23, 59) });
    renderPanel(
      <ChatRoomPanel
        room={{
          ...SELECTED_CHAT_ROOM,
          messages: [
            { ...SELECTED_CHAT_ROOM.messages[0]!, sentDate: '2026-11-09' },
          ],
        }}
        socketStatus="connected"
      />,
    );
    expect(screen.getByRole('separator')).toHaveTextContent('오늘');

    jest.setSystemTime(new Date(2026, 10, 10, 0, 1));
    fireEvent.change(screen.getByRole('textbox', { name: '메시지' }), {
      target: { value: 'a' },
    });

    expect(screen.getByRole('separator')).toHaveTextContent('어제');
  });

  it('새 메시지가 추가되면 기존 스크롤 컨테이너를 유지하고 하단으로 이동한다', () => {
    const { rerender } = renderPanel(
      <ChatRoomPanel room={SELECTED_CHAT_ROOM} socketStatus="connected" />,
    );
    const messagesElement = screen.getAllByRole('separator')[0]!.parentElement!;
    Object.defineProperty(messagesElement, 'scrollHeight', {
      configurable: true,
      value: 1200,
    });
    messagesElement.scrollTop = 100;

    rerender(
      <ChatRoomPanel
        room={{
          ...SELECTED_CHAT_ROOM,
          messages: [
            ...SELECTED_CHAT_ROOM.messages,
            {
              ...SELECTED_CHAT_ROOM.messages[0]!,
              id: 'new',
              text: '새로 받은 메시지',
            },
          ],
        }}
        socketStatus="connected"
      />,
    );

    expect(screen.getByText('새로 받은 메시지')).toBeInTheDocument();
    expect(screen.getAllByRole('separator')[0]!.parentElement).toBe(
      messagesElement,
    );
    expect(messagesElement.scrollTop).toBe(1200);
  });

  it('과거 메시지를 추가하면 같은 스크롤 컨테이너에서 기존 읽던 위치를 보정한다', async () => {
    let animationCallback: FrameRequestCallback | undefined;
    jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        animationCallback = callback;
        return 1;
      });
    const handleLoadPrevious = jest.fn<() => Promise<void>>();
    const { rerender } = renderPanel(
      <ChatRoomPanel
        room={SELECTED_CHAT_ROOM}
        socketStatus="connected"
        hasPreviousMessages
        onLoadPreviousMessages={handleLoadPrevious}
      />,
    );
    const messagesElement = screen.getByRole('button', {
      name: '이전 메시지 불러오기',
    }).parentElement!;
    let scrollHeight = 1000;
    Object.defineProperty(messagesElement, 'scrollHeight', {
      configurable: true,
      get: () => scrollHeight,
    });
    messagesElement.scrollTop = 100;
    handleLoadPrevious.mockImplementation(async () => {
      scrollHeight = 1300;
      rerender(
        <ChatRoomPanel
          room={{
            ...SELECTED_CHAT_ROOM,
            messages: [
              {
                ...SELECTED_CHAT_ROOM.messages[0]!,
                id: 'old',
                text: '이전 메시지',
              },
              ...SELECTED_CHAT_ROOM.messages,
            ],
          }}
          socketStatus="connected"
          hasPreviousMessages
          onLoadPreviousMessages={handleLoadPrevious}
        />,
      );
    });

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: '이전 메시지 불러오기' }),
      );
    });
    expect(animationCallback).toBeDefined();
    act(() => animationCallback?.(0));

    expect(screen.getByText('이전 메시지')).toBeInTheDocument();
    expect(screen.getAllByRole('separator')[0]!.parentElement).toBe(
      messagesElement,
    );
    expect(messagesElement.scrollTop).toBe(400);
  });

  it('상단 바에는 상대와 메뉴를, 글 요약에는 상품·상태·상태 변경을 표시한다', () => {
    renderPanel(
      <ChatRoomPanel
        room={SELECTED_CHAT_ROOM}
        closeHref="/trade/1"
        onChangeTradeStatus={async () => undefined}
      />,
    );

    const partnerHeading = screen.getByRole('heading', {
      name: SELECTED_CHAT_ROOM.partnerName,
    });
    const roomHeader = partnerHeading.closest('header') as HTMLElement;
    const productSummary = screen.getByRole('region', {
      name: '교환 상품 정보',
    });

    expect(
      within(roomHeader).getByRole('link', { name: '채팅 닫기' }),
    ).toBeInTheDocument();
    expect(
      within(roomHeader).getByRole('button', {
        name: `${SELECTED_CHAT_ROOM.partnerName} 사용자 메뉴`,
      }),
    ).toBeInTheDocument();
    expect(within(roomHeader).queryByText('교환 가능')).not.toBeInTheDocument();
    expect(screen.getAllByText('교환 가능')).toHaveLength(1);
    expect(
      within(productSummary).getByText(SELECTED_CHAT_ROOM.itemTitle),
    ).toBeInTheDocument();
    expect(within(productSummary).getByText('교환 가능')).toBeInTheDocument();
    expect(
      within(productSummary).getByRole('button', { name: '예약 확정' }),
    ).toBeInTheDocument();
  });

  it('웹 분할 화면용 뒤로 가기는 넓은 화면에서 숨길 수 있게 표시한다', () => {
    renderPanel(
      <ChatRoomPanel
        room={SELECTED_CHAT_ROOM}
        onClose={() => undefined}
        closeVisibility="mobile"
      />,
    );

    expect(screen.getByRole('button', { name: '채팅 닫기' })).toHaveAttribute(
      'data-visibility',
      'mobile',
    );
  });

  it('보낸 메시지와 받은 메시지를 발신자별 말풍선과 시간으로 표시한다', () => {
    renderPanel(<ChatRoomPanel room={SELECTED_CHAT_ROOM} />);

    const myMessage = SELECTED_CHAT_ROOM.messages.find(
      (message) => message.sender === 'me' && message.text,
    );

    expect(myMessage).toBeDefined();
    const bubble = screen.getByText(myMessage?.text ?? '');

    expect(bubble).toHaveAttribute('data-sender', 'me');
    const messageRow = bubble.parentElement?.parentElement as HTMLElement;

    expect(messageRow).toHaveAttribute('data-sender', 'me');
    expect(
      within(messageRow).getByText(myMessage?.sentAt ?? ''),
    ).toBeInTheDocument();
  });

  it('메시지 날짜가 바뀌는 지점마다 날짜 구분선을 표시한다', () => {
    jest.useFakeTimers({ now: new Date(2026, 9, 1, 12, 0) });

    const messages = [
      ['2025-12-31', '작년 메시지'],
      ['2026-09-29', '그저께 메시지'],
      ['2026-09-29', '그저께 두 번째 메시지'],
      ['2026-09-30', '어제 메시지'],
      ['2026-10-01', '오늘 메시지'],
    ].map(([sentDate, text], index) => ({
      id: `message-${index}`,
      sender: 'other' as const,
      text: text ?? '',
      sentAt: '오후 2:00',
      sentDate: sentDate ?? '',
      images: [],
    }));

    renderPanel(
      <ChatRoomPanel
        room={{ ...SELECTED_CHAT_ROOM, messages }}
        socketStatus="connected"
      />,
    );

    expect(
      screen.getAllByRole('separator').map((divider) => divider.textContent),
    ).toEqual(['2025년 12월 31일', '9월 29일', '어제', '오늘']);
  });

  it('연결된 채팅방에서 입력한 메시지를 전송한다', async () => {
    const user = userEvent.setup();
    const handleSendMessage = jest.fn<(content: string) => Promise<void>>();
    handleSendMessage.mockResolvedValue();

    renderPanel(
      <ChatRoomPanel
        room={SELECTED_CHAT_ROOM}
        socketStatus="connected"
        onSendMessage={handleSendMessage}
      />,
    );

    await user.type(
      screen.getByRole('textbox', { name: '메시지' }),
      '안녕하세요',
    );
    await user.click(screen.getByRole('button', { name: '보내기' }));

    expect(handleSendMessage).toHaveBeenCalledWith('안녕하세요');
    expect(screen.getByRole('textbox', { name: '메시지' })).toHaveValue('');
  });

  it('서버에 연결 중이면 메시지 입력을 비활성화한다', () => {
    renderPanel(
      <ChatRoomPanel room={SELECTED_CHAT_ROOM} socketStatus="connecting" />,
    );

    expect(screen.getByRole('textbox', { name: '메시지' })).toBeDisabled();
    expect(
      screen.getByPlaceholderText('채팅 서버에 연결하고 있어요'),
    ).toBeInTheDocument();
  });

  it('사진을 선택하면 미리보기를 제공하고 취소할 수 있다', async () => {
    const user = userEvent.setup();

    renderPanel(
      <ChatRoomPanel
        room={SELECTED_CHAT_ROOM}
        socketStatus="connected"
        onSendImages={async () => undefined}
      />,
    );

    const image = new File(['image'], 'offer.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText('사진 추가'), image);

    expect(
      screen.getByRole('img', { name: 'offer.jpg 미리보기' }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'offer.jpg 사진 취소' }),
    );
    expect(
      screen.queryByRole('img', { name: 'offer.jpg 미리보기' }),
    ).not.toBeInTheDocument();
  });

  it('사진과 선택적인 설명을 함께 전송하고 성공 후 입력을 비운다', async () => {
    const user = userEvent.setup();
    const handleSendImages =
      jest.fn<(content: string, files: File[]) => Promise<void>>();
    handleSendImages.mockResolvedValue();

    renderPanel(
      <ChatRoomPanel
        room={SELECTED_CHAT_ROOM}
        socketStatus="connected"
        onSendImages={handleSendImages}
      />,
    );

    const image = new File(['image'], 'offer.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText('사진 추가'), image);
    await user.type(
      screen.getByRole('textbox', { name: '메시지' }),
      '이 사진이에요',
    );
    await user.click(screen.getByRole('button', { name: '보내기' }));

    expect(handleSendImages).toHaveBeenCalledWith('이 사진이에요', [image]);
    expect(screen.getByRole('textbox', { name: '메시지' })).toHaveValue('');
    expect(screen.queryByLabelText('전송할 사진')).not.toBeInTheDocument();
  });

  it('채팅 입력 영역에 놓은 사진을 미리보기에 추가한다', () => {
    renderPanel(
      <ChatRoomPanel
        room={SELECTED_CHAT_ROOM}
        socketStatus="connected"
        onSendImages={async () => undefined}
      />,
    );

    const image = new File(['image'], 'dropped.png', { type: 'image/png' });
    const composerArea = screen.getByRole('form', {
      name: '메시지 입력 영역',
    }).parentElement;

    fireEvent.drop(composerArea as HTMLElement, {
      dataTransfer: { files: [image] },
    });

    expect(
      screen.getByRole('img', { name: 'dropped.png 미리보기' }),
    ).toBeInTheDocument();
  });

  it('사진 전송이 실패하면 작성 내용과 선택 사진을 유지한다', async () => {
    const user = userEvent.setup();

    renderPanel(
      <ChatRoomPanel
        room={SELECTED_CHAT_ROOM}
        socketStatus="connected"
        onSendImages={async () => {
          throw new Error('사진을 전송하지 못했습니다.');
        }}
      />,
    );

    const image = new File(['image'], 'offer.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText('사진 추가'), image);
    await user.type(
      screen.getByRole('textbox', { name: '메시지' }),
      '다시 보낼 내용',
    );
    await user.click(screen.getByRole('button', { name: '보내기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '사진을 전송하지 못했습니다.',
    );
    expect(screen.getByRole('textbox', { name: '메시지' })).toHaveValue(
      '다시 보낼 내용',
    );
    expect(
      screen.getByRole('img', { name: 'offer.jpg 미리보기' }),
    ).toBeInTheDocument();
  });

  it('수신한 사진을 기존 사진 뷰어로 확대한다', async () => {
    const user = userEvent.setup();
    const room = {
      ...SELECTED_CHAT_ROOM,
      messages: [
        {
          id: 'image-message',
          sender: 'other' as const,
          text: '',
          sentAt: '오후 2:00',
          sentDate: '2026-10-01',
          images: [
            {
              url: 'https://cdn.example.com/chat/photo.webp',
              name: '교환 사진',
            },
          ],
        },
      ],
    };

    renderPanel(<ChatRoomPanel room={room} />);
    await user.click(
      screen.getByRole('button', { name: '1번째 사진 크게 보기' }),
    );

    expect(
      await screen.findByRole('dialog', { name: '채팅 사진 크게 보기' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '채팅 사진 닫기' }));
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: '채팅 사진 크게 보기' }),
      ).not.toBeInTheDocument();
    });
  });

  it('이전 메시지가 있을 때 버튼으로 추가 조회한다', async () => {
    const user = userEvent.setup();
    const handleLoadPreviousMessages = jest.fn<() => Promise<void>>();
    handleLoadPreviousMessages.mockResolvedValue();

    renderPanel(
      <ChatRoomPanel
        room={SELECTED_CHAT_ROOM}
        hasPreviousMessages
        onLoadPreviousMessages={handleLoadPreviousMessages}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: '이전 메시지 불러오기' }),
    );

    expect(handleLoadPreviousMessages).toHaveBeenCalledTimes(1);
  });

  it('이전 메시지를 불러오는 동안 중복 요청을 막는다', () => {
    renderPanel(
      <ChatRoomPanel
        room={SELECTED_CHAT_ROOM}
        hasPreviousMessages
        isLoadingPreviousMessages
      />,
    );

    expect(
      screen.getByRole('button', { name: '불러오는 중...' }),
    ).toBeDisabled();
  });

  it('작성자가 예약 확정을 누르면 교환 진행 중 상태 변경을 요청한다', async () => {
    const user = userEvent.setup();
    const handleChangeTradeStatus =
      jest.fn<
        (status: 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED') => Promise<void>
      >();
    handleChangeTradeStatus.mockResolvedValue();

    renderPanel(
      <ChatRoomPanel
        room={SELECTED_CHAT_ROOM}
        onChangeTradeStatus={handleChangeTradeStatus}
      />,
    );

    await user.click(screen.getByRole('button', { name: '예약 확정' }));

    expect(handleChangeTradeStatus).toHaveBeenCalledWith('IN_PROGRESS');
  });

  it('교환 진행 중인 글의 작성자에게 거래 완료를 제공한다', async () => {
    const user = userEvent.setup();
    const handleChangeTradeStatus =
      jest.fn<
        (status: 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED') => Promise<void>
      >();
    handleChangeTradeStatus.mockResolvedValue();

    renderPanel(
      <ChatRoomPanel
        room={{ ...SELECTED_CHAT_ROOM, tradeStatus: 'IN_PROGRESS' }}
        onChangeTradeStatus={handleChangeTradeStatus}
      />,
    );

    await user.click(screen.getByRole('button', { name: '거래 완료' }));

    expect(handleChangeTradeStatus).toHaveBeenCalledWith('COMPLETED');
  });

  it('구매자에게는 교환 상태 변경 버튼을 노출하지 않는다', () => {
    renderPanel(
      <ChatRoomPanel
        room={{ ...SELECTED_CHAT_ROOM, isTradeOwner: false }}
        onChangeTradeStatus={async () => undefined}
      />,
    );

    expect(
      screen.queryByRole('button', { name: '예약 확정' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '거래 완료' }),
    ).not.toBeInTheDocument();
  });

  it('거래글 이동과 상대 사용자 신고 메뉴를 제공한다', async () => {
    const user = userEvent.setup();

    renderPanel(<ChatRoomPanel room={SELECTED_CHAT_ROOM} />);

    expect(
      screen.getByRole('link', {
        name: `${SELECTED_CHAT_ROOM.itemTitle} 교환글 보기`,
      }),
    ).toHaveAttribute('href', `/trade/${SELECTED_CHAT_ROOM.tradeId}`);
    await user.click(
      screen.getByRole('button', {
        name: `${SELECTED_CHAT_ROOM.partnerName} 사용자 메뉴`,
      }),
    );
    await user.click(screen.getByRole('menuitem', { name: '신고하기' }));

    expect(
      screen.getByRole('heading', {
        name: `${SELECTED_CHAT_ROOM.partnerName}님 신고하기`,
      }),
    ).toBeInTheDocument();
  });

  it('상태 변경에 실패하면 서버 오류를 표시한다', async () => {
    const user = userEvent.setup();

    renderPanel(
      <ChatRoomPanel
        room={SELECTED_CHAT_ROOM}
        onChangeTradeStatus={async () => {
          throw new Error('상태를 변경할 수 없습니다.');
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: '예약 확정' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '상태를 변경할 수 없습니다.',
    );
  });
});
