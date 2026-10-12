import styled from '@emotion/styled';
import { Link } from 'react-router';

import { TradeStatusBadge } from '@/domains/trade/components/TradeStatusBadge';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { formatRelativeTime } from '@/shared/date/formatRelativeTime';
import { LogoImagePlaceholder } from '@/shared/ui/LogoImagePlaceholder';

import type { TradeItem } from '../../model/tradeItem';

export interface ProductCardProps {
  item: TradeItem;
  source?: 'trade_list' | 'related_list' | 'mypage';
}

export default function ProductCard({
  item,
  source = 'trade_list',
}: ProductCardProps) {
  const place =
    item.tradePlace?.name || item.tradePlace?.address || '교환 장소 협의';
  const categories = item.categories.join(' · ') || '카테고리 미설정';

  return (
    <Card
      to={`/trade/${item.tradeId}`}
      onClick={() =>
        captureAnalyticsEvent('trade_selected', {
          trade_id: item.tradeId,
          status: item.status,
          source,
        })
      }
    >
      <Thumbnail>
        {item.thumbnailUrl ? (
          <Image src={item.thumbnailUrl} alt="" />
        ) : (
          <LogoImagePlaceholder />
        )}
      </Thumbnail>

      <CardContent>
        <Title>{item.title}</Title>
        <Categories>{categories}</Categories>
        <Meta>{place}</Meta>
        <Meta>{formatRelativeTime(item.createdAt)}</Meta>
        <BadgeRow>
          <TradeStatusBadge status={item.status} />
        </BadgeRow>
      </CardContent>
    </Card>
  );
}

const Card = styled(Link)`
  box-sizing: border-box;
  display: flex;
  width: 100%;
  max-width: 221px;
  height: 100%;
  min-width: 0;
  padding: 8px 8px 12px;
  flex-direction: column;
  border: 1px solid rgb(36 33 34 / 10%);
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgb(36 33 34 / 10%);
  color: inherit;
  text-decoration: none;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;

  &:hover {
    border-color: rgb(217 59 84 / 30%);
    box-shadow: 0 12px 28px rgb(36 33 34 / 14%);
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 4px;
  }
`;

const Thumbnail = styled.div`
  box-sizing: border-box;
  display: grid;
  width: 100%;
  max-width: 205px;
  height: auto;
  aspect-ratio: 205 / 205;
  margin-bottom: 12px;
  overflow: hidden;
  place-items: center;
  border: 1px solid #ececef;
  border-radius: 16px;
  background: #f3f3f5;
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const CardContent = styled.div`
  display: flex;
  min-width: 0;
  padding: 0 4px;
  flex: 1;
  flex-direction: column;
  gap: 12px;
`;

const Title = styled.h3`
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: #25252a;
  font-size: 17px;
  font-weight: 500;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

const Categories = styled.p`
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: #4e5058;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

const Meta = styled.p`
  margin: 0;
  overflow: hidden;
  color: #777b86;
  font-size: 14px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const BadgeRow = styled.div`
  display: inline-flex;
  align-self: flex-start;
`;
