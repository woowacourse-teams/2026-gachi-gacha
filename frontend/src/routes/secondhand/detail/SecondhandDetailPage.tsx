import { useState } from 'react';
import styled from '@emotion/styled';

import ChatDrawer from './components/ChatDrawer';
import TradeDetail from './components/TradeDetail';
import type { ChatRoom } from './model/chatRoom';
import type { SecondhandDetail } from './model/secondhandDetail';
import Header from '../../home/components/Header';
import ProductCard from '../components/ProductCard';
import type { SecondhandItem } from '../model/secondhandItem';

interface SecondhandDetailPageProps {
  detail: SecondhandDetail;
  relatedItems: SecondhandItem[];
  chatRoom: ChatRoom;
  initialChatOpen?: boolean;
}

export default function SecondhandDetailPage({
  detail,
  relatedItems,
  chatRoom,
  initialChatOpen = false,
}: SecondhandDetailPageProps) {
  const [isChatOpen, setIsChatOpen] = useState(initialChatOpen);

  return (
    <Page>
      <Header activeItem="중고거래" />

      <Main>
        <TradeDetail detail={detail} onChatClick={() => setIsChatOpen(true)} />

        <RelatedSection>
          <RelatedHeader>
            <RelatedTitle>다른 중고거래</RelatedTitle>
            <MoreButton type="button">전체보기 →</MoreButton>
          </RelatedHeader>

          <ProductGrid>
            {relatedItems.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </ProductGrid>
        </RelatedSection>
      </Main>

      {isChatOpen && (
        <ChatDrawer room={chatRoom} onClose={() => setIsChatOpen(false)} />
      )}
    </Page>
  );
}

const Page = styled.div`
  min-height: 100dvh;
  background: #ffffff;
`;

const Main = styled.main`
  box-sizing: border-box;
  width: min(100%, 1240px);
  margin: 0 auto;
  padding: 36px 32px 80px;

  @media (max-width: 680px) {
    padding: 24px 16px 56px;
  }
`;

const RelatedSection = styled.section`
  padding-top: 48px;
`;

const RelatedHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
`;

const RelatedTitle = styled.h2`
  margin: 0;
  color: #25262b;
  font-size: 24px;
  letter-spacing: -0.03em;
`;

const MoreButton = styled.button`
  padding: 8px;
  border: 0;
  background: transparent;
  color: #73757e;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 40px 20px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 620px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 30px 12px;
  }
`;
