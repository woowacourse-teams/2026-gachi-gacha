import styled from '@emotion/styled';

import type { ChatRoom } from '../../model/chat';

interface ChatRoomPanelProps {
  room: ChatRoom | undefined;
}

export default function ChatRoomPanel({ room }: ChatRoomPanelProps) {
  if (!room) {
    return (
      <EmptyPanel>
        <EmptyIcon aria-hidden="true">
          <Bubble />
          <Bubble data-back="true" />
        </EmptyIcon>
        <EmptyTitle>대화방을 선택해주세요</EmptyTitle>
      </EmptyPanel>
    );
  }

  return (
    <Panel>
      <RoomHeader>
        <div>
          <PartnerName>{room.partnerName}</PartnerName>
          <PartnerMeta>{room.partnerNeighborhood}</PartnerMeta>
        </div>
        <TradeStatus>{room.tradeStatus}</TradeStatus>
      </RoomHeader>

      <ProductSummary>
        <ProductImage>이미지 없음</ProductImage>
        <ProductInfo>
          <ProductLabel>교환 상품</ProductLabel>
          <ProductTitle>{room.itemTitle}</ProductTitle>
        </ProductInfo>
      </ProductSummary>

      <Messages>
        <DateDivider>오늘</DateDivider>
        {room.messages.map((message) => (
          <MessageRow key={message.id} data-sender={message.sender}>
            <MessageBubble data-sender={message.sender}>
              {message.text}
            </MessageBubble>
            <SentAt>{message.sentAt}</SentAt>
          </MessageRow>
        ))}
      </Messages>

      <Composer aria-label="메시지 입력 영역">
        <ComposerPlaceholder>메시지를 입력하세요</ComposerPlaceholder>
        <SendLabel>보내기</SendLabel>
      </Composer>
    </Panel>
  );
}

const EmptyPanel = styled.section`
  display: grid;
  min-width: 0;
  min-height: 680px;
  place-content: center;
  justify-items: center;
  gap: 24px;
  background: #ffffff;
`;

const EmptyIcon = styled.div`
  position: relative;
  width: 96px;
  height: 72px;
`;

const Bubble = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  width: 64px;
  height: 48px;
  border-radius: 14px 14px 14px 4px;
  background: #d8d3d5;

  &[data-back='true'] {
    top: 24px;
    right: 0;
    left: auto;
    background: #ece9ea;
    transform: scaleX(-1);
  }
`;

const EmptyTitle = styled.h2`
  margin: 0;
  color: #2b2528;
  font-size: 20px;
  font-weight: 700;
`;

const Panel = styled.section`
  display: grid;
  min-width: 0;
  min-height: 680px;
  grid-template-rows: auto auto 1fr auto;
  background: #ffffff;
`;

const RoomHeader = styled.header`
  display: flex;
  min-height: 82px;
  padding: 18px 24px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #eeeaec;
`;

const PartnerName = styled.h2`
  margin: 0;
  color: #2b2528;
  font-size: 18px;
  font-weight: 700;
`;

const PartnerMeta = styled.p`
  margin: 5px 0 0;
  color: #9a9095;
  font-size: 12px;
`;

const TradeStatus = styled.span`
  padding: 7px 10px;
  border-radius: 999px;
  background: #fce9ef;
  color: #963c5d;
  font-size: 12px;
  font-weight: 700;
`;

const ProductSummary = styled.div`
  display: flex;
  padding: 14px 24px;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #eeeaec;
`;

const ProductImage = styled.div`
  display: grid;
  width: 52px;
  height: 52px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 10px;
  background: #f3f0f1;
  color: #aaa5a8;
  font-size: 9px;
  font-weight: 700;
`;

const ProductInfo = styled.div`
  min-width: 0;
`;

const ProductLabel = styled.p`
  margin: 0 0 4px;
  color: #9a9095;
  font-size: 11px;
`;

const ProductTitle = styled.p`
  margin: 0;
  overflow: hidden;
  color: #2b2528;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Messages = styled.div`
  display: flex;
  padding: 28px 24px;
  flex-direction: column;
  gap: 12px;
  background: #fcfbfb;
`;

const DateDivider = styled.span`
  margin: 0 auto 8px;
  color: #aaa2a6;
  font-size: 11px;
`;

const MessageRow = styled.div`
  display: flex;
  max-width: 76%;
  align-items: flex-end;
  gap: 7px;

  &[data-sender='me'] {
    align-self: flex-end;
    flex-direction: row-reverse;
  }
`;

const MessageBubble = styled.p`
  margin: 0;
  padding: 11px 14px;
  border-radius: 15px 15px 15px 4px;
  background: #ffffff;
  color: #2b2528;
  font-size: 13px;
  line-height: 1.55;
  box-shadow: 0 1px 4px rgb(43 37 40 / 8%);

  &[data-sender='me'] {
    border-radius: 15px 15px 4px;
    background: #ed174c;
    color: #ffffff;
  }
`;

const SentAt = styled.span`
  flex: 0 0 auto;
  color: #aaa2a6;
  font-size: 10px;
`;

const Composer = styled.div`
  display: flex;
  margin: 16px 20px;
  min-height: 48px;
  padding: 0 8px 0 18px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #eeeaec;
  border-radius: 999px;
  background: #faf8f9;
`;

const ComposerPlaceholder = styled.span`
  color: #aaa2a6;
  font-size: 13px;
`;

const SendLabel = styled.span`
  padding: 8px 12px;
  border-radius: 999px;
  background: #ed174c;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
`;
