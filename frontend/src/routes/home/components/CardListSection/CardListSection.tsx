import { useEffect, useRef } from 'react';
import styled from '@emotion/styled';

import Card from '../Card';
import type { CardProps } from '../Card';

interface CardListItem extends CardProps {
  id: number;
}

interface Props {
  title: string;
  items: CardListItem[];
  hasNextPage?: boolean;
  isLoadingMore?: boolean;
  loadMoreError?: boolean;
  onEndReached?: () => void;
}

export default function CardListSection(props: Props) {
  const endMarkerRef = useRef<HTMLDivElement>(null);
  const { hasNextPage, isLoadingMore, loadMoreError, onEndReached } = props;

  useEffect(() => {
    const marker = endMarkerRef.current;

    if (
      !marker ||
      !hasNextPage ||
      isLoadingMore ||
      loadMoreError ||
      !onEndReached
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onEndReached();
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(marker);

    return () => observer.disconnect();
  }, [hasNextPage, isLoadingMore, loadMoreError, onEndReached]);

  if (props.items.length === 0) {
    return (
      <Wrapper>
        <Title>{props.title}</Title>
        <EmptyMessage>이 카테고리에는 아직 상품이 없어요.</EmptyMessage>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Title>{props.title}</Title>
      <List>
        {props.items.map((item) => (
          <Card key={item.id} imageUrl={item.imageUrl} name={item.name} />
        ))}
      </List>

      {props.isLoadingMore && (
        <PageMessage role="status">
          다음 페이지를 불러오는 중이에요.
        </PageMessage>
      )}

      {props.loadMoreError && (
        <RetryButton type="button" onClick={props.onEndReached}>
          다음 페이지 다시 불러오기
        </RetryButton>
      )}

      <EndMarker ref={endMarkerRef} aria-hidden="true" />
    </Wrapper>
  );
}

const Wrapper = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 24px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #2b2528;
`;

const List = styled.div`
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 240px));
  justify-content: center;
  gap: 20px;

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const EndMarker = styled.div`
  height: 1px;
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

const EmptyMessage = styled.p`
  margin: 24px 0;
  font-size: 14px;
  color: #9a9095;
  text-align: center;
`;
