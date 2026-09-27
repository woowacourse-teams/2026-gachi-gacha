import { useEffect, useState } from 'react';
import styled from '@emotion/styled';

import type { ChatMessage, ChatRoom } from '../../model/chatRoom';

interface ChatDrawerProps {
  room: ChatRoom;
  onClose: () => void;
}

export default function ChatDrawer({ room, onClose }: ChatDrawerProps) {
  const [message, setMessage] = useState('');
  const [sentMessages, setSentMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    setSentMessages((currentMessages) => [
      ...currentMessages,
      {
        id: crypto.randomUUID(),
        sender: 'me',
        text: trimmedMessage,
        sentAt: '방금',
      },
    ]);
    setMessage('');
  };

  const messages = [...room.messages, ...sentMessages];

  return (
    <Overlay onMouseDown={onClose}>
      <Panel
        role="dialog"
        aria-modal="true"
        aria-label={`${room.partner.nickname}님과의 채팅`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <Header>
          <Partner>
            <PartnerName>{room.partner.nickname}</PartnerName>
            <OnlineStatus>
              <OnlineDot data-online={room.partner.isOnline} />
              {room.partner.isOnline ? '접속 중' : '오프라인'}
            </OnlineStatus>
          </Partner>
          <CloseButton type="button" aria-label="채팅 닫기" onClick={onClose}>
            ×
          </CloseButton>
        </Header>

        <ProductSummary>
          <ProductThumbnail>
            {room.product.imageUrl ? (
              <ProductImage src={room.product.imageUrl} alt="" />
            ) : (
              '🎁'
            )}
          </ProductThumbnail>
          <ProductInfo>
            <ProductTitle>{room.product.title}</ProductTitle>
            <TradeCount>
              거래 완료 {room.partner.completedTradeCount}회
            </TradeCount>
          </ProductInfo>
          <ProposalButton type="button">교환 제안</ProposalButton>
        </ProductSummary>

        <SafetyNotice>
          <ShieldIcon aria-hidden="true">✓</ShieldIcon>
          <div>
            <SafetyTitle>외부 거래 유도와 사기를 주의하세요</SafetyTitle>
            <SafetyDescription>
              개인정보나 선입금을 요구하면 대화를 중단해주세요.
            </SafetyDescription>
          </div>
        </SafetyNotice>

        <Messages aria-live="polite">
          <DateDivider>오늘</DateDivider>
          {messages.map((chatMessage) => (
            <MessageRow key={chatMessage.id} data-sender={chatMessage.sender}>
              <MessageBubble data-sender={chatMessage.sender}>
                {chatMessage.text}
              </MessageBubble>
              <SentAt>{chatMessage.sentAt}</SentAt>
            </MessageRow>
          ))}
        </Messages>

        <Composer onSubmit={handleSubmit}>
          <AttachButton type="button" aria-label="파일 첨부">
            +
          </AttachButton>
          <MessageInput
            value={message}
            aria-label="메시지"
            placeholder="메시지를 입력하세요."
            onChange={(event) => setMessage(event.target.value)}
          />
          <SendButton type="submit" disabled={!message.trim()}>
            보내기
          </SendButton>
        </Composer>
      </Panel>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  z-index: 100;
  inset: 0;
  background: rgb(18 19 22 / 58%);
`;

const Panel = styled.section`
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  width: min(500px, 100%);
  height: 100dvh;
  flex-direction: column;
  background: #ffffff;
  box-shadow: -16px 0 40px rgb(0 0 0 / 14%);
  animation: slide-in 180ms ease-out;

  @keyframes slide-in {
    from {
      transform: translateX(24px);
      opacity: 0;
    }
  }
`;

const Header = styled.header`
  display: flex;
  min-height: 74px;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #ececef;
`;

const Partner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PartnerName = styled.strong`
  color: #24252a;
  font-size: 18px;
`;

const OnlineStatus = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #858790;
  font-size: 12px;
`;

const OnlineDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #a6a8af;

  &[data-online='true'] {
    background: #31aa7b;
  }
`;

const CloseButton = styled.button`
  display: grid;
  width: 40px;
  height: 40px;
  padding: 0;
  place-items: center;
  border: 0;
  background: transparent;
  color: #4e5058;
  font-size: 30px;
  cursor: pointer;
`;

const ProductSummary = styled.section`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid #ececef;
`;

const ProductThumbnail = styled.div`
  display: grid;
  width: 58px;
  height: 58px;
  flex: 0 0 auto;
  overflow: hidden;
  place-items: center;
  border-radius: 10px;
  background: #f3efff;
  font-size: 28px;
`;

const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ProductInfo = styled.div`
  min-width: 0;
  flex: 1;
`;

const ProductTitle = styled.p`
  margin: 0 0 5px;
  overflow: hidden;
  color: #303136;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TradeCount = styled.p`
  margin: 0;
  color: #898b94;
  font-size: 12px;
`;

const ProposalButton = styled.button`
  min-height: 40px;
  padding: 0 14px;
  border: 0;
  border-radius: 9px;
  background: #ed174c;
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
`;

const SafetyNotice = styled.aside`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 18px 20px 0;
  padding: 14px 16px;
  border: 1px solid #e3e0ff;
  border-radius: 14px;
  background: #f6f5ff;
`;

const ShieldIcon = styled.span`
  display: grid;
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 7px;
  background: #6c63e8;
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
`;

const SafetyTitle = styled.p`
  margin: 0 0 3px;
  color: #3e3d55;
  font-size: 13px;
  font-weight: 800;
`;

const SafetyDescription = styled.p`
  margin: 0;
  color: #79778d;
  font-size: 11px;
  line-height: 1.45;
`;

const Messages = styled.div`
  display: flex;
  padding: 24px 20px;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  background: #fbfbfc;
`;

const DateDivider = styled.p`
  align-self: center;
  margin: 0 0 14px;
  padding: 5px 10px;
  border-radius: 999px;
  background: #eeeef1;
  color: #8c8e96;
  font-size: 11px;
`;

const MessageRow = styled.div`
  display: flex;
  max-width: 82%;
  align-items: flex-end;
  gap: 6px;

  &[data-sender='me'] {
    align-self: flex-end;
    flex-direction: row-reverse;
  }
`;

const MessageBubble = styled.p`
  margin: 0;
  padding: 11px 14px;
  border-radius: 5px 15px 15px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgb(30 31 35 / 7%);
  color: #34353a;
  font-size: 14px;
  line-height: 1.5;

  &[data-sender='me'] {
    border-radius: 15px 5px 15px 15px;
    background: #ed174c;
    color: #ffffff;
  }
`;

const SentAt = styled.span`
  flex: 0 0 auto;
  color: #9a9ca4;
  font-size: 10px;
`;

const Composer = styled.form`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  border-top: 1px solid #e8e8eb;
  background: #ffffff;
`;

const AttachButton = styled.button`
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  padding: 0;
  place-items: center;
  border: 1px solid #d7d8dc;
  border-radius: 50%;
  background: #ffffff;
  color: #777983;
  font-size: 24px;
  cursor: pointer;
`;

const MessageInput = styled.input`
  box-sizing: border-box;
  min-width: 0;
  height: 44px;
  padding: 0 14px;
  flex: 1;
  border: 1px solid transparent;
  border-radius: 999px;
  outline: none;
  background: #f6f6f7;
  color: #2d2e33;
  font-size: 14px;

  &:focus {
    border-color: #ed174c;
  }
`;

const SendButton = styled.button`
  min-height: 38px;
  padding: 0 10px;
  border: 0;
  background: transparent;
  color: #ed174c;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    color: #b9bbc2;
    cursor: default;
  }
`;
