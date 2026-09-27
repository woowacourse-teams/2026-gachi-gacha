import styled from '@emotion/styled';

import TradingToolbar from './components/TradingToolbar';
import Header from '../../home/components/Header';
import ProductCard from '../components/ProductCard';
import type { SecondhandItem } from '../model/secondhandItem';

interface SecondhandPageProps {
  items: SecondhandItem[];
}

export default function SecondhandPage({ items }: SecondhandPageProps) {
  return (
    <Page>
      <Header activeItem="중고거래" />

      <Main>
        <TradingToolbar
          neighborhood="신당동"
          address="서울특별시 중구 신당동"
        />

        <ResultsPanel>
          <ProductGrid>
            {items.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </ProductGrid>
        </ResultsPanel>
      </Main>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100dvh;
  background: #f5f5f6;
`;

const Main = styled.main`
  display: flex;
  box-sizing: border-box;
  width: min(100%, 1480px);
  margin: 0 auto;
  padding: 40px 32px 72px;
  flex-direction: column;
  gap: 36px;

  @media (max-width: 720px) {
    padding: 28px 16px 48px;
    gap: 28px;
  }
`;

const ResultsPanel = styled.section`
  padding: 28px;
  border-radius: 28px;
  background: #ffffff;

  @media (max-width: 720px) {
    padding: 16px;
    border-radius: 20px;
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 44px 24px;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 32px 14px;
  }
`;
