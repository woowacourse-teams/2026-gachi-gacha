import styled from '@emotion/styled';
import { Link } from 'react-router';

import type { TradeStatus } from '@/domains/trade/tradeSummaryType';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { formatRelativeTime } from '@/shared/date/formatRelativeTime';
import { LogoImagePlaceholder } from '@/shared/ui/LogoImagePlaceholder';

import type { TradeItem } from '../../model/tradeItem';

export interface ProductCardProps {
  item: TradeItem;
  source?: 'trade_list' | 'related_list' | 'mypage';
}

const STATUS_LABELS: Record<TradeStatus, string> = {
  AVAILABLE: '교환 가능',
  IN_PROGRESS: '교환 진행 중',
  COMPLETED: '교환 완료',
};

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

      <Title>{item.title}</Title>
      <Categories>{categories}</Categories>
      <Meta>{place}</Meta>
      <Meta>{formatRelativeTime(item.createdAt)}</Meta>
      <Badge $status={item.status}>{STATUS_LABELS[item.status]}</Badge>
    </Card>
  );
}

const Card = styled(Link)`
  display: block;
  width: 100%;
  max-width: 205px;
  min-width: 0;
  color: inherit;
  text-decoration: none;

  &:focus-visible {
    outline: 3px solid rgb(217 59 84 / 24%);
    outline-offset: 4px;
  }
`;

const Thumbnail = styled.div`
  display: grid;
  width: 100%;
  max-width: 205px;
  height: auto;
  aspect-ratio: 205 / 205;
  margin-bottom: 14px;
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

const Categories = styled.p`
  margin: 0 0 6px;
  color: #4e5058;
  font-size: 14px;
  font-weight: 700;
`;

const Meta = styled.p`
  margin: 2px 0 0;
  color: #777b86;
  font-size: 14px;
`;

const Badge = styled.span<{ $status: TradeStatus }>`
  display: inline-flex;
  margin-top: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  background: ${({ $status }) =>
    $status === 'AVAILABLE' ? '#fff1f3' : '#f1f1f3'};
  color: ${({ $status }) => ($status === 'AVAILABLE' ? '#d93b54' : '#696466')};
  font-size: 12px;
  font-weight: 700;
`;
