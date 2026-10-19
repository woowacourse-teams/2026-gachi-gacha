import { beforeEach, describe, expect, it } from '@jest/globals';
import { http, HttpResponse } from 'msw';

import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import { server } from '@/test/server';

import {
  createChatRoom,
  findChatRoomByTrade,
  getChatMessages,
  getChatRooms,
  markChatMessagesRead,
  uploadChatImages,
} from './chatApi';

const room = {
  roomId: 7,
  trade: {
    tradeId: 15,
    memberId: 3,
    title: '쿠로미 피규어 교환해요',
    status: 'AVAILABLE',
    thumbnailUrl: null,
  },
  otherMember: {
    memberId: 8,
    nickname: '가챠좋아',
    profileImageUrl: null,
  },
  lastMessage: {
    preview: '안녕하세요',
    sendAt: '2026-10-01T09:20:00',
  },
  unreadCount: 1,
  createdAt: '2026-10-01T09:00:00',
};

describe('chatApi', () => {
  beforeEach(() => {
    storeAuthTokens({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('내 채팅방 목록을 불러오고 sendAt 필드를 화면 모델로 변환한다', async () => {
    server.use(
      http.get('/api/v1/chat/rooms/me', ({ request }) => {
        expect(request.headers.get('Authorization')).toBe(
          'Bearer access-token',
        );

        return HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: { rooms: [room] },
        });
      }),
    );

    const rooms = await getChatRooms();

    expect(rooms[0]?.lastMessage?.sentAt).toBe('2026-10-01T09:20:00');
  });

  it('게시글에 기존 채팅방이 있으면 roomId를 반환한다', async () => {
    server.use(
      http.get('/api/v1/chat/rooms/existence', ({ request }) => {
        expect(new URL(request.url).searchParams.get('tradeId')).toBe('15');

        return HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: { isExist: true, roomId: 7 },
        });
      }),
    );

    await expect(findChatRoomByTrade(15)).resolves.toBe(7);
  });

  it('새 채팅방을 만들 때 게시글 ID를 JSON으로 전송한다', async () => {
    server.use(
      http.post('/api/v1/chat/rooms', async ({ request }) => {
        expect(await request.json()).toEqual({ tradeId: 15 });

        return HttpResponse.json({
          code: 'C001',
          message: '정상 생성',
          data: { roomId: 9, tradeId: 15, createdAt: '2026-10-01T10:00:00' },
        });
      }),
    );

    await expect(createChatRoom(15)).resolves.toBe(9);
  });

  it('메시지 목록을 조회하고 마지막 sequence까지 읽음 처리한다', async () => {
    let receivedSequence: unknown = null;

    server.use(
      http.get('/api/v1/chat/rooms/7/messages', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            messages: [
              {
                messageId: 'message-1',
                sequence: 42,
                roomId: 7,
                senderId: 8,
                type: 'TEXT',
                content: '안녕하세요',
                files: [],
                createdAt: '2026-10-01T09:20:00',
              },
            ],
            nextLastSequence: null,
            hasNext: false,
          },
        }),
      ),
      http.patch('/api/v1/chat/rooms/7/messages/read', async ({ request }) => {
        receivedSequence = await request.json();

        return HttpResponse.json({ code: 'C002', message: '정상 수정' });
      }),
    );

    const page = await getChatMessages(7);
    await markChatMessagesRead(7, page.messages[0]?.sequence ?? 0);

    expect(receivedSequence).toEqual({ lastReadSequence: 42 });
  });

  it('이전 메시지 커서와 페이지 크기를 쿼리로 전송한다', async () => {
    let receivedSearch = '';

    server.use(
      http.get('/api/v1/chat/rooms/7/messages', ({ request }) => {
        receivedSearch = new URL(request.url).search;

        return HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            messages: [],
            nextLastSequence: null,
            hasNext: false,
          },
        });
      }),
    );

    await getChatMessages(7, { lastSequence: 81, pageSize: 20 });

    expect(receivedSearch).toBe('?lastSequence=81&pageSize=20');
  });

  it('인증된 multipart 요청으로 채팅 사진을 업로드한다', async () => {
    let authorizationHeader: string | null = null;
    let uploadedFileNames: string[] = [];

    server.use(
      http.post('/api/v1/files', async ({ request }) => {
        authorizationHeader = request.headers.get('Authorization');
        const formData = await request.formData();
        uploadedFileNames = formData
          .getAll('files')
          .filter((file): file is File => file instanceof File)
          .map((file) => file.name);

        return HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            files: [
              {
                url: 'https://cdn.example.com/chat/one.webp',
                originalName: 'one.webp',
                contentType: 'image/webp',
                size: 5,
              },
            ],
          },
        });
      }),
    );

    const result = await uploadChatImages([
      new File(['image'], 'one.webp', { type: 'image/webp' }),
    ]);

    expect(authorizationHeader).toBe('Bearer access-token');
    expect(uploadedFileNames).toEqual(['one.webp']);
    expect(result[0]?.url).toBe('https://cdn.example.com/chat/one.webp');
  });

  it('이미지 메시지의 nullable 본문과 파일 목록을 정규화한다', async () => {
    server.use(
      http.get('/api/v1/chat/rooms/7/messages', () =>
        HttpResponse.json({
          code: 'C000',
          message: '정상',
          data: {
            messages: [
              {
                messageId: 42,
                sequence: 42,
                roomId: 7,
                senderId: 8,
                type: 'IMAGE',
                content: null,
                files: [
                  {
                    url: 'https://cdn.example.com/chat/photo.webp',
                    originalName: 'photo.webp',
                    contentType: 'image/webp',
                    size: 5,
                  },
                ],
                createdAt: '2026-10-01T09:20:00',
              },
            ],
            nextLastSequence: null,
            hasNext: false,
          },
        }),
      ),
    );

    const page = await getChatMessages(7);

    expect(page.messages[0]).toMatchObject({
      messageId: '42',
      content: null,
      files: [expect.objectContaining({ originalName: 'photo.webp' })],
    });
  });
});
