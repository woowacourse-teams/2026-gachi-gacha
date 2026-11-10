import styled from '@emotion/styled';
import { Link } from 'react-router';

import type { ChatSocketStatus } from '@/domains/chat/useChatSocket';
import type { TradeStatus } from '@/domains/trade/tradeSummaryType';
import { zIndex } from '@/shared/styles/tokens';
import { AppHeader } from '@/shared/ui/AppHeader';

import ChatRoomPanel from './components/ChatRoomPanel';
import ConversationList from './components/ConversationList';
import type { ConversationListProps } from './components/ConversationList/ConversationList';
import type { ChatConversation, ChatRoom } from './model/chat';

interface ChatPageProps {
  conversations: ChatConversation[];
  listStatus?: ConversationListProps['status'];
  listErrorMessage?: string;
  onRetryList?: () => void;
  selectedConversationId?: number | undefined;
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
  listStatus = 'success',
  listErrorMessage,
  onRetryList,
  selectedConversationId,
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
        <AppHeader currentPath="/chat" />
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
      <AppHeader
        currentPath="/chat"
        mobileVariant="title"
        mobileTitle="채팅"
        showMobileTabs={!selectedRoom}
        {...(listStatus === 'success'
          ? {
              chatUnreadCount: conversations.reduce(
                (total, conversation) => total + conversation.unreadCount,
                0,
              ),
            }
          : {})}
      />
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
          selectedConversationId={
            selectedConversationId ?? selectedRoom?.conversationId
          }
          status={listStatus}
          errorMessage={listErrorMessage}
          onRetry={onRetryList}
          onSelectConversation={(conversationId) =>
            onSelectConversation?.(conversationId)
          }
        />
        {selectedRoom ? (
          <ChatRoomPanel
            room={selectedRoom}
            onClose={
              selectedRoom ? () => onSelectConversation?.(null) : undefined
            }
            closeVisibility="mobile"
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
        ) : (
          <ConversationPrompt>
            <h2>대화를 선택해 주세요</h2>
            <p>왼쪽 목록에서 채팅방을 고르면 여기에 표시돼요.</p>
          </ConversationPrompt>
        )}
      </Main>
    </Page>
  );
}

const Page = styled.div<{ $hasSelectedRoom?: boolean }>`
  display: flex;
  height: 100dvh;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  background: white;
  @media (max-width: 767px) {
    padding-bottom: ${({ $hasSelectedRoom }) => ($hasSelectedRoom ? 0 : 'calc(56px + env(safe-area-inset-bottom))')};
    box-sizing: border-box;
  }

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
  flex: none;
  margin: 0;
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
  z-index: ${zIndex.modal};
  inset: 0;
  background: rgb(24 21 22 / 54%);
`;

const ModalLayer = styled.div`
  position: fixed;
  z-index: ${zIndex.modal};
  inset: 0;
`;

const ModalScrim = styled.button`
  position: fixed;
  z-index: ${zIndex.modal};
  inset: 0;
  padding: 0;
  border: 0;
  background: rgb(24 21 22 / 54%);
  cursor: pointer;
`;

const ChatDrawer = styled.aside`
  position: fixed;
  z-index: ${zIndex.modal + 1};
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
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  grid-template-columns: 380px minmax(0, 1fr);
  background: white;
  > section {
    min-height: 0;
  }
  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
    > aside {
      display: ${({ $hasSelectedRoom }) => ($hasSelectedRoom ? 'none' : 'block')};
    }
    > section {
      display: ${({ $hasSelectedRoom }) => ($hasSelectedRoom ? 'grid' : 'none')};
      min-height: 0;
    }
  }
`;
const ConversationPrompt = styled.section`
  display: flex;
  min-width: 0;
  min-height: 0;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 6px;
  padding: 24px;
  text-align: center;
  h2 {
    margin: 0;
    color: #242122;
    font-size: 16px;
    font-weight: 700;
  }
  p {
    margin: 0;
    color: #696466;
    font-size: 14px;
    line-height: 1.4;
  }
`;
