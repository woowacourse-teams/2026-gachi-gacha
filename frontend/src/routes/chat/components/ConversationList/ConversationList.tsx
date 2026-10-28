import styled from '@emotion/styled';

import { TradeStatusBadge } from '@/domains/trade/components/TradeStatusBadge';

import type { ChatConversation } from '../../model/chat';

interface ConversationListProps {
  conversations: ChatConversation[];
  selectedConversationId: number | undefined;
  onSelectConversation?: (conversationId: number) => void;
}

export default function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) {
  return (
    <Panel>
      <Header>
        <Title>전체 대화</Title>
        <Count>{conversations.length}</Count>
      </Header>

      <Notice>
        <NoticeTitle>채팅 알림이 꺼져있어요</NoticeTitle>
        <NoticeDescription>
          알림을 켜고 교환 메시지를 확인해요
        </NoticeDescription>
      </Notice>

      <List>
        {conversations.length === 0 && (
          <EmptyMessage>아직 시작한 대화가 없어요.</EmptyMessage>
        )}
        {conversations.map((conversation) => (
          <Conversation
            key={conversation.id}
            type="button"
            data-selected={conversation.id === selectedConversationId}
            onClick={() => onSelectConversation?.(conversation.id)}
          >
            <Avatar aria-hidden="true">
              {conversation.partnerProfileImageUrl ? (
                <AvatarImage src={conversation.partnerProfileImageUrl} alt="" />
              ) : (
                conversation.partnerName[0]
              )}
            </Avatar>
            <ConversationContent>
              <ConversationHeader>
                <PartnerName>{conversation.partnerName}</PartnerName>
                <MessageTime>{conversation.lastMessageAt}</MessageTime>
              </ConversationHeader>
              <ItemTitle>{conversation.itemTitle}</ItemTitle>
              <LastMessage>{conversation.lastMessage}</LastMessage>
            </ConversationContent>
            <Meta>
              <TradeStatusBadge status={conversation.status} />
              {conversation.unreadCount > 0 && (
                <UnreadCount>{conversation.unreadCount}</UnreadCount>
              )}
            </Meta>
          </Conversation>
        ))}
      </List>
    </Panel>
  );
}

const Panel = styled.aside`
  min-width: 0;
  border-right: 1px solid #eeeaec;
  background: #ffffff;
`;

const Header = styled.header`
  display: flex;
  padding: 28px 28px 20px;
  align-items: center;
  gap: 8px;
`;

const Title = styled.h1`
  margin: 0;
  color: #2b2528;
  font-size: 24px;
  font-weight: 700;
`;

const Count = styled.span`
  color: #ed174c;
  font-size: 14px;
  font-weight: 700;
`;

const Notice = styled.div`
  margin: 20px;
  padding: 18px;
  border-radius: 14px;
  background: #f4fbf9;
`;

const NoticeTitle = styled.p`
  margin: 0 0 5px;
  color: #2b2528;
  font-size: 14px;
  font-weight: 700;
`;

const NoticeDescription = styled.p`
  margin: 0;
  color: #3ca986;
  font-size: 13px;
  font-weight: 700;
`;

const List = styled.div`
  display: grid;
`;

const Conversation = styled.button`
  display: flex;
  min-width: 0;
  padding: 20px;
  align-items: center;
  gap: 14px;
  border-top: 0;
  border-right: 0;
  border-bottom: 1px solid #f3f0f1;
  border-left: 0;
  background: #ffffff;
  color: inherit;
  text-decoration: none;
  text-align: left;
  cursor: pointer;

  &[data-selected='true'] {
    background: #fff7f9;
  }
`;

const EmptyMessage = styled.p`
  margin: 0;
  padding: 48px 20px;
  color: #8d8589;
  text-align: center;
`;

const Avatar = styled.div`
  display: grid;
  width: 48px;
  height: 48px;
  overflow: hidden;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: #fce9ef;
  color: #963c5d;
  font-size: 18px;
  font-weight: 700;
`;

const AvatarImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
  border-radius: inherit;
  object-fit: cover;
`;

const ConversationContent = styled.div`
  min-width: 0;
  flex: 1;
`;

const ConversationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PartnerName = styled.strong`
  overflow: hidden;
  color: #2b2528;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MessageTime = styled.span`
  color: #aaa2a6;
  font-size: 11px;
`;

const ItemTitle = styled.p`
  margin: 5px 0 2px;
  overflow: hidden;
  color: #6f6469;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const LastMessage = styled.p`
  margin: 0;
  overflow: hidden;
  color: #8d8589;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Meta = styled.div`
  display: grid;
  flex: 0 0 auto;
  justify-items: end;
  gap: 8px;
`;

const UnreadCount = styled.span`
  display: grid;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  place-items: center;
  border-radius: 999px;
  background: #ed174c;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
`;
