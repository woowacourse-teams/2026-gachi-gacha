import styled from '@emotion/styled';

import type { ChatConversation } from '../../model/chat';

interface ConversationListProps {
  conversations: ChatConversation[];
  selectedConversationId: number | undefined;
}

const FILTERS = ['전체', '답장 대기', '진행 중', '교환 완료'] as const;

export default function ConversationList({
  conversations,
  selectedConversationId,
}: ConversationListProps) {
  return (
    <Panel>
      <Header>
        <Title>전체 대화</Title>
        <Count>{conversations.length}</Count>
      </Header>

      <FilterList aria-label="대화 상태">
        {FILTERS.map((filter, index) => (
          <Filter key={filter} data-active={index === 0}>
            {filter}
          </Filter>
        ))}
      </FilterList>

      <Notice>
        <NoticeTitle>채팅 알림이 꺼져있어요</NoticeTitle>
        <NoticeDescription>
          알림을 켜고 교환 메시지를 확인해요
        </NoticeDescription>
      </Notice>

      <List>
        {conversations.map((conversation) => (
          <Conversation
            key={conversation.id}
            data-selected={conversation.id === selectedConversationId}
          >
            <Avatar aria-hidden="true">{conversation.partnerName[0]}</Avatar>
            <ConversationContent>
              <ConversationHeader>
                <PartnerName>{conversation.partnerName}</PartnerName>
                <MessageTime>{conversation.lastMessageAt}</MessageTime>
              </ConversationHeader>
              <ItemTitle>{conversation.itemTitle}</ItemTitle>
              <LastMessage>{conversation.lastMessage}</LastMessage>
            </ConversationContent>
            <Meta>
              <Status>{conversation.status}</Status>
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

const FilterList = styled.div`
  display: flex;
  padding: 0 28px 24px;
  flex-wrap: wrap;
  gap: 8px;
  border-bottom: 1px solid #eeeaec;
`;

const Filter = styled.span`
  padding: 9px 14px;
  border: 1px solid #eeeaec;
  border-radius: 999px;
  color: #6f6469;
  font-size: 13px;
  font-weight: 700;

  &[data-active='true'] {
    border-color: #2b2528;
    background: #2b2528;
    color: #ffffff;
  }
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

const Conversation = styled.article`
  display: flex;
  min-width: 0;
  padding: 20px;
  align-items: center;
  gap: 14px;
  border-bottom: 1px solid #f3f0f1;
  background: #ffffff;

  &[data-selected='true'] {
    background: #fff7f9;
  }
`;

const Avatar = styled.div`
  display: grid;
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: #fce9ef;
  color: #963c5d;
  font-size: 18px;
  font-weight: 700;
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

const Status = styled.span`
  color: #ed174c;
  font-size: 11px;
  font-weight: 700;
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
