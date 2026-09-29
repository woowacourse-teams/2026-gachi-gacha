import styled from '@emotion/styled';

import { AppGachaSearchHeader } from '@/features/gachaSearch/AppGachaSearchHeader';

import ChatRoomPanel from './components/ChatRoomPanel';
import ConversationList from './components/ConversationList';
import type { ChatConversation, ChatRoom } from './model/chat';

interface ChatPageProps {
  conversations: ChatConversation[];
  selectedRoom?: ChatRoom;
}

export default function ChatPage({
  conversations,
  selectedRoom,
}: ChatPageProps) {
  return (
    <Page>
      <AppGachaSearchHeader currentPath="/chat" />
      <Main>
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedRoom?.conversationId}
        />
        <ChatRoomPanel room={selectedRoom} />
      </Main>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100dvh;
  background: #f7f5f6;
`;

const Main = styled.main`
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
    width: calc(100% - 32px);
    grid-template-columns: 1fr;

    > section {
      display: none;
    }
  }
`;
