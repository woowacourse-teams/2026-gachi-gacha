import styled from '@emotion/styled';

import type { SecondhandItem } from '../../model/secondhandItem';

export interface ProductCardProps {
  item: SecondhandItem;
}

const priceFormatter = new Intl.NumberFormat('ko-KR');

export default function ProductCard({ item }: ProductCardProps) {
  const price =
    item.price === null ? '나눔' : `${priceFormatter.format(item.price)}원`;

  return (
    <Card>
      <Thumbnail $backgroundColor={item.visualColor}>
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt="" />
        ) : (
          <Visual>{item.visual}</Visual>
        )}
      </Thumbnail>

      <Title>{item.title}</Title>
      <Price>{price}</Price>
      <Meta>
        {item.neighborhood} · {item.postedAt}
      </Meta>
      {item.badge && <Badge>{item.badge}</Badge>}
    </Card>
  );
}

const Card = styled.article`
  min-width: 0;
`;

const Thumbnail = styled.div<{ $backgroundColor: string }>`
  display: grid;
  width: 100%;
  aspect-ratio: 1 / 1;
  margin-bottom: 14px;
  overflow: hidden;
  place-items: center;
  border: 1px solid #ececef;
  border-radius: 16px;
  background: ${({ $backgroundColor }) => $backgroundColor};
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Visual = styled.span`
  font-size: clamp(52px, 7vw, 88px);
  filter: drop-shadow(0 12px 16px rgb(36 35 40 / 10%));
`;

const Title = styled.h3`
  min-height: 48px;
  margin: 0 0 4px;
  overflow: hidden;
  color: #25252a;
  font-size: 17px;
  font-weight: 500;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

const Price = styled.p`
  margin: 0 0 6px;
  color: #1f2024;
  font-size: 18px;
  font-weight: 800;
`;

const Meta = styled.p`
  margin: 0;
  color: #777b86;
  font-size: 14px;
`;

const Badge = styled.span`
  display: inline-flex;
  margin-top: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  background: #fff1ec;
  color: #ec6f31;
  font-size: 12px;
  font-weight: 700;
`;
