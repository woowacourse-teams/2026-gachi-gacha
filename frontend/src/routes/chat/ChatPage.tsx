import styled from '@emotion/styled';
import { Link } from 'react-router';

import type { ChatSocketStatus } from '@/domains/chat/useChatSocket';
import type { TradeStatus } from '@/domains/trade/tradeSummaryType';
import { AppGachaSearchHeader } from '@/features/gachaSearch/AppGachaSearchHeader';

import ChatRoomPanel from './components/ChatRoomPanel';
import ConversationList from './components/ConversationList';
import type { ChatConversation, ChatRoom } from './model/chat';

interface ChatPageProps {
  conversations: ChatConversation[];
  selectedRoom?: ChatRoom | undefined;
  roomLoadError?: string;
  onRetryRoom?: () => void;
  socketStatus?: ChatSocketStatus;
  socketErrorMessage?: string | null;
  onSendMessage?: (content: string) => Promise<void>;
  onSendImages?: (content: string, images: File[]) => Promise<void>;
  presentation?: 'drawer' | 'modal' | 'split';
  onSelectConversation?: (conversationId: number | null) => void;
  onCloseModal?: () => void;
  hasPreviousMessages?: boolean;
  isLoadingPreviousMessages?: boolean;
  previousMessagesError?: string;
  onLoadPreviousMessages?: () => Promise<void>;
  onChangeTradeStatus?: (status: TradeStatus) => Promise<void>;
  onPartnerBlocked?: () => void;
}

export default function ChatPage({
  conversations,
  selectedRoom,
  roomLoadError = '',
  onRetryRoom,
  socketStatus = 'disconnected',
  socketErrorMessage = null,
  onSendMessage,
  onSendImages,
  presentation = 'drawer',
  onSelectConversation,
  onCloseModal,
  hasPreviousMessages = false,
  isLoadingPreviousMessages = false,
  previousMessagesError = '',
  onLoadPreviousMessages,
  onChangeTradeStatus,
  onPartnerBlocked,
}: ChatPageProps) {
  if (selectedRoom && presentation === 'modal') {
    return (
      <ModalLayer>
        <ModalScrim
          type="button"
          aria-label="채팅을 닫고 교환 게시글로 돌아가기"
          onClick={onCloseModal}
        />
        <ChatDrawer
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedRoom.partnerName}님과의 채팅`}
        >
          <ChatRoomPanel
            room={selectedRoom}
            onClose={onCloseModal}
            socketStatus={socketStatus}
            socketErrorMessage={socketErrorMessage}
            onSendMessage={onSendMessage}
            onSendImages={onSendImages}
            hasPreviousMessages={hasPreviousMessages}
            isLoadingPreviousMessages={isLoadingPreviousMessages}
            previousMessagesError={previousMessagesError}
            onLoadPreviousMessages={onLoadPreviousMessages}
            onChangeTradeStatus={onChangeTradeStatus}
            onPartnerBlocked={onPartnerBlocked}
          />
        </ChatDrawer>
      </ModalLayer>
    );
  }

  if (selectedRoom && presentation === 'drawer') {
    const tradeHref = `/trade/${selectedRoom.tradeId}`;

    return (
      <RoomPage>
        <AppGachaSearchHeader currentPath="/chat" />
        <TradeContext aria-hidden="true">
          <TradeContextImage>
            {selectedRoom.itemImageUrl ? (
              <img src={selectedRoom.itemImageUrl} alt="" />
            ) : (
              <span>이미지 없음</span>
            )}
          </TradeContextImage>
          <TradeContextInfo>
            <p>교환 게시글</p>
            <h1>{selectedRoom.itemTitle}</h1>
            <strong>{selectedRoom.tradeStatus}</strong>
          </TradeContextInfo>
        </TradeContext>

        <Scrim to={tradeHref} aria-label="채팅을 닫고 교환 게시글로 돌아가기" />
        <ChatDrawer
          aria-label={`${selectedRoom.partnerName}님과의 채팅 페이지`}
        >
          <ChatRoomPanel
            room={selectedRoom}
            closeHref={tradeHref}
            socketStatus={socketStatus}
            socketErrorMessage={socketErrorMessage}
            onSendMessage={onSendMessage}
            onSendImages={onSendImages}
            hasPreviousMessages={hasPreviousMessages}
            isLoadingPreviousMessages={isLoadingPreviousMessages}
            previousMessagesError={previousMessagesError}
            onLoadPreviousMessages={onLoadPreviousMessages}
            onChangeTradeStatus={onChangeTradeStatus}
            onPartnerBlocked={onPartnerBlocked}
          />
        </ChatDrawer>
      </RoomPage>
    );
  }

  return (
    <Page $hasSelectedRoom={Boolean(selectedRoom)}>
      <AppGachaSearchHeader currentPath="/chat" />
      {roomLoadError && (
        <RoomLoadError role="alert">
          <span>{roomLoadError} 다른 채팅방은 계속 확인할 수 있어요.</span>
          {onRetryRoom && (
            <RetryRoomButton type="button" onClick={onRetryRoom}>
              다시 시도
            </RetryRoomButton>
          )}
        </RoomLoadError>
      )}
      <Main $hasSelectedRoom={Boolean(selectedRoom)}>
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedRoom?.conversationId}
          onSelectConversation={(conversationId) =>
            onSelectConversation?.(conversationId)
          }
        />
        <ChatRoomPanel
          room={selectedRoom}
          onClose={
            selectedRoom ? () => onSelectConversation?.(null) : undefined
          }
          socketStatus={socketStatus}
          socketErrorMessage={socketErrorMessage}
          onSendMessage={onSendMessage}
          onSendImages={onSendImages}
          hasPreviousMessages={hasPreviousMessages}
          isLoadingPreviousMessages={isLoadingPreviousMessages}
          previousMessagesError={previousMessagesError}
          onLoadPreviousMessages={onLoadPreviousMessages}
          onChangeTradeStatus={onChangeTradeStatus}
          onPartnerBlocked={onPartnerBlocked}
        />
      </Main>
    </Page>
  );
}

const Page = styled.div<{ $hasSelectedRoom?: boolean }>`
  min-height: 100dvh;
  background: #f7f5f6;

  @media (max-width: 900px) {
    ${({ $hasSelectedRoom }) =>
      $hasSelectedRoom &&
      `
        height: 100dvh;
        min-height: 0;
        overflow: hidden;

        > header {
          display: none;
        }
      `}
  }
`;

const RoomLoadError = styled.div`
  display: flex;
  width: min(100% - 32px, 1320px);
  margin: 24px auto 0;
  padding: 14px 18px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid #f4b9c8;
  border-radius: 12px;
  background: #fff6f8;
  color: #a41d42;
`;

const RetryRoomButton = styled.button`
  flex: none;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
`;

const RoomPage = styled(Page)`
  position: relative;
  overflow: hidden;

  @media (max-width: 900px) {
    height: 100dvh;
    min-height: 0;

    > header,
    > main,
    > a {
      display: none;
    }
  }
`;

const TradeContext = styled.main`
  display: grid;
  width: min(100% - 64px, 1120px);
  margin: 52px auto;
  grid-template-columns: minmax(320px, 620px) minmax(280px, 1fr);
  align-items: center;
  gap: 56px;

  @media (max-width: 760px) {
    width: calc(100% - 32px);
    grid-template-columns: 1fr;
  }
`;

const TradeContextImage = styled.div`
  display: grid;
  overflow: hidden;
  aspect-ratio: 1;
  place-items: center;
  border-radius: 20px;
  background: #eeecee;
  color: #9a9095;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const TradeContextInfo = styled.div`
  color: #2b2528;

  p {
    margin: 0 0 12px;
    color: #8d8589;
  }

  h1 {
    margin: 0 0 24px;
    font-size: 32px;
  }

  strong {
    color: #ed174c;
  }
`;

const Scrim = styled(Link)`
  position: fixed;
  z-index: 20;
  inset: 0;
  background: rgb(24 21 22 / 54%);
`;

const ModalLayer = styled.div`
  position: fixed;
  z-index: 20;
  inset: 0;
`;

const ModalScrim = styled.button`
  position: fixed;
  z-index: 20;
  inset: 0;
  padding: 0;
  border: 0;
  background: rgb(24 21 22 / 54%);
  cursor: pointer;
`;

const ChatDrawer = styled.aside`
  position: fixed;
  z-index: 21;
  top: 0;
  right: 0;
  width: min(680px, 100%);
  height: 100dvh;
  overflow: hidden;
  background: #ffffff;
  box-shadow: -12px 0 36px rgb(24 21 22 / 18%);
`;

const Main = styled.main<{ $hasSelectedRoom: boolean }>`
  display: grid;
  width: min(100%, 1320px);
  min-height: 680px;
  margin: 36px auto 64px;
  overflow: hidden;
  grid-template-columns: 430px minmax(0, 1fr);
  border: 1px solid #eeeaec;
  border-radius: 22px;
  background: #ffffff;

  @media (max-width: 900px) {
    width: ${({ $hasSelectedRoom }) =>
      $hasSelectedRoom ? '100%' : 'calc(100% - 32px)'};
    min-height: ${({ $hasSelectedRoom }) => ($hasSelectedRoom ? '0' : '680px')};
    height: ${({ $hasSelectedRoom }) => ($hasSelectedRoom ? '100dvh' : 'auto')};
    margin: ${({ $hasSelectedRoom }) =>
      $hasSelectedRoom ? '0' : '36px auto 64px'};
    grid-template-columns: 1fr;
    border: ${({ $hasSelectedRoom }) =>
      $hasSelectedRoom ? '0' : '1px solid #eeeaec'};
    border-radius: ${({ $hasSelectedRoom }) =>
      $hasSelectedRoom ? '0' : '22px'};

    > aside {
      display: ${({ $hasSelectedRoom }) =>
        $hasSelectedRoom ? 'none' : 'block'};
    }

    > section {
      display: ${({ $hasSelectedRoom }) =>
        $hasSelectedRoom ? 'grid' : 'none'};
      min-height: 0;
    }
  }
`;
