import styled from '@emotion/styled';

import type { GachaProductSummary } from '@/domains/product/gachaProductType';

import type { LoadMoreStatus } from '../../model/loadMoreStatus';
import Card from '../Card';

interface Props {
  title: string;
  items: GachaProductSummary[];
  hasNextPage?: boolean;
  loadMoreStatus?: LoadMoreStatus;
  onEndReached?: () => void;
}

export default function CardListSection(props: Props) {
  if (props.items.length === 0) {
    return (
      <Wrapper>
        <Title>{props.title}</Title>
        <EmptyMessage>상품 조사 중이에요.</EmptyMessage>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Title>{props.title}</Title>
      <List>
        {props.items.map((item, index) => (
          <Card
            key={item.gachaId}
            product={item}
            categoryName={props.title}
            resultPosition={index}
          />
        ))}
      </List>

      {props.hasNextPage && props.loadMoreStatus === 'idle' && (
        <MoreButton type="button" onClick={props.onEndReached}>
          가챠 더보기
        </MoreButton>
      )}

      {props.loadMoreStatus === 'loading' && (
        <PageMessage role="status">
          다음 페이지를 불러오는 중이에요.
        </PageMessage>
      )}

      {props.loadMoreStatus === 'error' && (
        <RetryButton type="button" onClick={props.onEndReached}>
          다음 페이지 다시 불러오기
        </RetryButton>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.section`
  box-sizing: border-box;
  display: flex;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  flex-direction: column;
  gap: 12px;
  padding: 0 24px;
`;

const Title = styled.h2`
  width: 100%;
  max-width: 1136px;
  margin: 0 auto;
  font-size: 17px;
  font-weight: 700;
  color: #2b2528;
`;

const List = styled.div`
  display: grid;
  width: 100%;
  max-width: 1136px;
  margin: 24px auto 0;
  grid-template-columns: repeat(5, minmax(0, 208px));
  justify-content: center;
  gap: 28px 24px;

  @media (max-width: 1160px) {
    grid-template-columns: repeat(4, minmax(0, 208px));
  }

  @media (max-width: 920px) {
    grid-template-columns: repeat(3, minmax(0, 208px));
  }

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px 16px;
  }
`;

const PageMessage = styled.p`
  margin: 12px 0;
  font-size: 14px;
  color: #9a9095;
  text-align: center;
`;

const RetryButton = styled.button`
  align-self: center;
  padding: 8px 16px;
  border: 1px solid #eeeaec;
  border-radius: 999px;
  background: #ffffff;
  color: #6f6469;
  cursor: pointer;
`;

const MoreButton = styled(RetryButton)`
  min-width: 132px;
  border-color: #d93652;
  background: #ffffff;
  color: #c82f49;
  font-weight: 700;

  &:hover {
    background: #fff4f6;
  }

  &:focus-visible {
    outline: 3px solid #f3a4b2;
    outline-offset: 3px;
  }
`;

const EmptyMessage = styled.p`
  margin: 24px 0;
  font-size: 14px;
  color: #9a9095;
  text-align: center;
`;
