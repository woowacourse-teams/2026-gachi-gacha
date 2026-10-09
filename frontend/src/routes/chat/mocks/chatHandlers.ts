import { http, HttpResponse } from 'msw';

import type { ChatTradeAction } from '@/domains/chat/chatType';

const CHAT_ROOMS_PATH = '/api/v1/chat/rooms';

const rooms = [
  {
    roomId: 1,
    trade: {
      tradeId: 1,
      title: '쿠로미 미니 피규어 vol.2',
      status: 'AVAILABLE',
      thumbnailUrl: 'https://placehold.co/205x205/png?text=Kuromi',
      availableAction: 'CONFIRM_RESERVATION' as ChatTradeAction | null,
    },
    otherMember: {
      memberId: 8,
      nickname: '가챠좋아',
      profileImageUrl: null,
    },
    lastMessage: {
      preview: '시나모롤 키링 사진 확인 부탁드려요.',
      sendAt: '2026-10-01T09:20:00',
    },
    unreadCount: 2,
    createdAt: '2026-10-01T09:12:00',
  },
  {
    roomId: 2,
    trade: {
      tradeId: 2,
      title: '마이멜로디 미니피규어',
      status: 'IN_PROGRESS',
      thumbnailUrl: null,
      availableAction: 'COMPLETE_TRADE' as ChatTradeAction | null,
    },
    otherMember: {
      memberId: 9,
      nickname: '피규어수집가',
      profileImageUrl: null,
    },
    lastMessage: {
      preview: '내일 합정역에서 뵐게요!',
      sendAt: '2026-09-30T18:00:00',
    },
    unreadCount: 0,
    createdAt: '2026-09-29T14:00:00',
  },
];

const messages = [
  {
    messageId: 'message-1',
    sequence: 21,
    roomId: 1,
    senderId: 8,
    type: 'TEXT',
    content: '안녕하세요! 올리신 쿠로미 피규어 아직 교환 가능할까요?',
    files: [],
    createdAt: '2026-10-01T09:12:00',
  },
  {
    messageId: 'message-2',
    sequence: 22,
    roomId: 1,
    senderId: 3,
    type: 'TEXT',
    content: '네, 아직 가능해요. 어떤 가챠와 교환 원하시나요?',
    files: [],
    createdAt: '2026-10-01T09:15:00',
  },
];

const previousMessages = [
  {
    messageId: 'message-previous-1',
    sequence: 19,
    roomId: 1,
    senderId: 8,
    type: 'TEXT',
    content: '어제 올리신 교환 글 보고 연락드려요.',
    files: [],
    createdAt: '2026-09-30T18:00:00',
  },
  {
    messageId: 'message-previous-2',
    sequence: 20,
    roomId: 1,
    senderId: 3,
    type: 'TEXT',
    content: '네, 안녕하세요!',
    files: [],
    createdAt: '2026-09-30T18:05:00',
  },
];

const createdRooms = new Map<number, (typeof rooms)[number]>();

function getRooms() {
  return [...rooms, ...createdRooms.values()];
}

export const chatHandlers = [
  http.get(`${CHAT_ROOMS_PATH}/me`, () =>
    HttpResponse.json({
      code: 'C000',
      message: '정상',
      data: { rooms: getRooms() },
    }),
  ),
  http.get(`${CHAT_ROOMS_PATH}/existence`, ({ request }) => {
    const tradeId = Number(new URL(request.url).searchParams.get('tradeId'));
    const room = getRooms().find(
      (candidate) => candidate.trade.tradeId === tradeId,
    );

    return HttpResponse.json({
      code: 'C000',
      message: '정상',
      data: { isExist: Boolean(room), roomId: room?.roomId ?? null },
    });
  }),
  http.post(CHAT_ROOMS_PATH, async ({ request }) => {
    const body = (await request.json()) as { tradeId?: number };
    const roomId = 99;

    createdRooms.set(roomId, {
      roomId,
      trade: {
        tradeId: body.tradeId ?? 0,
        title: `교환 게시글 ${body.tradeId ?? ''}`.trim(),
        status: 'AVAILABLE',
        thumbnailUrl: null,
        availableAction: null,
      },
      otherMember: {
        memberId: 4,
        nickname: '교환 상대',
        profileImageUrl: null,
      },
      lastMessage: {
        preview: '채팅방이 만들어졌어요.',
        sendAt: new Date().toISOString(),
      },
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    });

    return HttpResponse.json(
      {
        code: 'C001',
        message: '정상 생성',
        data: {
          roomId,
          tradeId: body.tradeId,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  }),
  http.get(`${CHAT_ROOMS_PATH}/:roomId/messages`, ({ params, request }) => {
    const roomId = Number(params.roomId);
    const lastSequence = new URL(request.url).searchParams.get('lastSequence');
    const isFirstRoomFirstPage = roomId === 1 && lastSequence === null;

    return HttpResponse.json({
      code: 'C000',
      message: '정상',
      data: {
        messages: (lastSequence === null ? messages : previousMessages).filter(
          (message) => message.roomId === roomId,
        ),
        nextLastSequence: isFirstRoomFirstPage ? 21 : null,
        hasNext: isFirstRoomFirstPage,
      },
    });
  }),
  http.patch(`${CHAT_ROOMS_PATH}/:roomId/messages/read`, () =>
    HttpResponse.json({ code: 'C002', message: '정상 수정' }),
  ),
  http.get(`${CHAT_ROOMS_PATH}/:roomId`, ({ params }) => {
    const room = getRooms().find(
      (candidate) => candidate.roomId === Number(params.roomId),
    );

    return room
      ? HttpResponse.json({ code: 'C000', message: '정상', data: room })
      : HttpResponse.json(
          { code: 'CHE001', message: '채팅방을 찾을 수 없습니다.' },
          { status: 404 },
        );
  }),
];
