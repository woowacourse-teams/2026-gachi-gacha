import styled from '@emotion/styled';

import { color, focusRing } from '@/shared/styles/tokens';
import { ImageWithFallback } from '@/shared/ui/ImageWithFallback';
import { LogoImagePlaceholder } from '@/shared/ui/LogoImagePlaceholder';

import type { ChatConversation } from '../../model/chat';

export interface ConversationListProps {
  conversations: ChatConversation[];
  selectedConversationId: number | undefined;
  onSelectConversation?: (conversationId: number) => void;
  status?: 'loading' | 'success' | 'error';
  errorMessage?: string | undefined;
  onRetry?: (() => void) | undefined;
}

export default function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  status = 'success',
  errorMessage,
  onRetry,
}: ConversationListProps) {
  return (
    <Panel aria-label="채팅 목록">
      <Header>
        <Title>채팅</Title>
      </Header>
      {status === 'loading' ? (
        <StateMessage role="status">채팅 목록을 불러오고 있어요.</StateMessage>
      ) : status === 'error' ? (
        <StateMessage role="alert">
          <strong>채팅을 불러오지 못했어요</strong>
          <p>{errorMessage || '잠시 후 다시 시도해 주세요.'}</p>
          {onRetry && (
            <RetryButton type="button" onClick={onRetry}>
              다시 시도
            </RetryButton>
          )}
        </StateMessage>
      ) : conversations.length === 0 ? (
        <StateMessage>아직 시작한 대화가 없어요.</StateMessage>
      ) : (
        <List>
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <Conversation
                type="button"
                aria-current={
                  conversation.id === selectedConversationId
                    ? 'true'
                    : undefined
                }
                onClick={() => onSelectConversation?.(conversation.id)}
              >
                <Photo>
                  <PhotoFallback>
                    <LogoImagePlaceholder />
                  </PhotoFallback>
                  <ItemImage
                    src={conversation.itemImageUrl}
                    alt={`${conversation.itemTitle} 교환 상품 사진`}
                    loading="lazy"
                  />
                </Photo>
                <Content>
                  <Top>
                    <PartnerName>{conversation.partnerName}</PartnerName>
                    <MessageTime>{conversation.lastMessageAt}</MessageTime>
                  </Top>
                  <Bottom>
                    <LastMessage>{conversation.lastMessage}</LastMessage>
                    {conversation.unreadCount > 0 && (
                      <UnreadCount
                        aria-label={`읽지 않은 메시지 ${conversation.unreadCount}개`}
                      >
                        {conversation.unreadCount > 99
                          ? '99+'
                          : conversation.unreadCount}
                      </UnreadCount>
                    )}
                  </Bottom>
                </Content>
              </Conversation>
            </li>
          ))}
        </List>
      )}
    </Panel>
  );
}

const Panel = styled.aside`
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  border-right: 1px solid ${color.border};
  background: white;
  @media (max-width: 900px) {
    border-right: 0;
  }
`;
const Header = styled.header`
  padding: 20px 24px 12px;
  @media (max-width: 767px) {
    display: none;
  }
`;
const Title = styled.h1`
  margin: 0;
  color: ${color.text};
  font-size: 20px;
  font-weight: 700;
  line-height: 1.4;
`;
const List = styled.ul`
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
`;
const Conversation = styled.button`
  display: flex;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 76px;
  padding: 12px 24px;
  align-items: center;
  gap: 12px;
  border: 0;
  background: white;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  &[aria-current='true'] {
    background: ${color.primarySoft};
  }
  &:focus-visible {
    outline: 3px solid ${color.primary};
    outline-offset: -3px;
  }
`;
const Photo = styled.span`
  position: relative;
  display: grid;
  box-sizing: border-box;
  width: 52px;
  height: 52px;
  flex: 0 0 auto;
  overflow: hidden;
  place-items: center;
  border: 1px solid ${color.border};
  border-radius: 12px;
  background: ${color.surfaceMuted};
`;
const PhotoFallback = styled.span`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  img {
    width: 40%;
  }
`;
const ItemImage = styled(ImageWithFallback)`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;
const Content = styled.span`
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 3px;
`;
const Top = styled.span`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
`;
const PartnerName = styled.strong`
  min-width: 0;
  overflow: hidden;
  flex: 1;
  color: ${color.text};
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const MessageTime = styled.span`
  flex: none;
  color: ${color.textSubtle};
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
`;
const Bottom = styled.span`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
`;
const LastMessage = styled.span`
  min-width: 0;
  overflow: hidden;
  flex: 1;
  color: ${color.textMuted};
  font-size: 14px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const UnreadCount = styled.span`
  display: grid;
  box-sizing: border-box;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  flex: none;
  place-items: center;
  border-radius: 999px;
  background: ${color.primary};
  color: white;
  font-size: 11px;
  font-weight: 700;
`;
const StateMessage = styled.div`
  display: grid;
  min-height: 160px;
  padding: 24px;
  place-content: center;
  gap: 12px;
  color: ${color.textMuted};
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
  p {
    margin: 0;
    overflow-wrap: anywhere;
  }
  strong {
    color: ${color.text};
  }
`;
const RetryButton = styled.button`
  min-height: 44px;
  padding: 0 16px;
  justify-self: center;
  border: 1px solid ${color.border};
  border-radius: 12px;
  background: white;
  color: ${color.text};
  font: inherit;
  cursor: pointer;
  &:focus-visible {
    outline: none;
    box-shadow: ${focusRing};
  }
`;
