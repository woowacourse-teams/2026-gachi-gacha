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
  eagerImage?: boolean;
  homeLayout?: boolean;
  relativeTime?: string;
  onOpen?: (() => void) | undefined;
}

export default function ProductCard({
  item,
  source = 'trade_list',
  eagerImage = false,
  homeLayout = false,
  relativeTime,
  onOpen,
}: ProductCardProps) {
  const place =
    item.tradePlace?.name || item.tradePlace?.address || '교환 장소 협의';
  const categories = item.categories.join(' · ') || '카테고리 미설정';

  return (
    <Card
      data-home-card={homeLayout || undefined}
      to={`/trade/${item.tradeId}`}
      state={onOpen ? { fromTradeList: true } : undefined}
      onClick={(event) => {
        if (
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          onOpen?.();
        }

        captureAnalyticsEvent('trade_selected', {
          trade_id: item.tradeId,
          status: item.status,
          source,
        });
      }}
    >
      <Thumbnail data-thumbnail>
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt=""
            loading={eagerImage ? 'eager' : 'lazy'}
            decoding="async"
          />
        ) : (
          <LogoImagePlaceholder />
        )}
      </Thumbnail>

      <CardContent>
        <PrimaryInfo>
          <ScreenReaderText>교환글 제목: </ScreenReaderText>
          <Title>{item.title}</Title>
          <Categories>
            <ScreenReaderText>카테고리: </ScreenReaderText>
            {categories}
          </Categories>
        </PrimaryInfo>

        <TradeInfo>
          <Meta>
            <ScreenReaderText>희망 교환 장소: </ScreenReaderText>
            {place}
          </Meta>
          <Meta>
            <ScreenReaderText>교환글 등록 날짜: </ScreenReaderText>
            {relativeTime ?? formatRelativeTime(item.createdAt)}
          </Meta>
          <BadgeRow>
            <ScreenReaderText>거래 상태: </ScreenReaderText>
            <span data-status>
              <TradeStatusBadge status={item.status} />
            </span>
            {homeLayout &&
              (item.likeCount !== undefined ||
                item.commentCount !== undefined) && (
                <Engagement>
                  {item.likeCount !== undefined && (
                    <span>
                      <ScreenReaderText>좋아요 </ScreenReaderText>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 20 4.5 12.5a4.5 4.5 0 0 1 6.4-6.4L12 7.2l1.1-1.1a4.5 4.5 0 0 1 6.4 6.4Z" />
                      </svg>
                      {item.likeCount}
                      <ScreenReaderText>개</ScreenReaderText>
                    </span>
                  )}
                  {item.commentCount !== undefined && (
                    <span>
                      <ScreenReaderText>댓글 </ScreenReaderText>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20 11.5a8 8 0 0 1-8 8H4l2-4a8 8 0 1 1 14-4Z" />
                      </svg>
                      {item.commentCount}
                      <ScreenReaderText>개</ScreenReaderText>
                    </span>
                  )}
                </Engagement>
              )}
          </BadgeRow>
        </TradeInfo>
      </CardContent>
    </Card>
  );
}

// 시각적인 카드 배치는 유지하면서 링크의 각 값이 뜻하는 항목을 설명한다.
const ScreenReaderText = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;

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
  &[data-home-card] {
    max-width: none;
  }

  @media (max-width: 767px) {
    &[data-home-card] {
      [data-thumbnail] {
        position: relative;
        margin: 0;
        border-radius: 12px;
      }

      [data-thumbnail] > img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
  }

  @media (min-width: 768px) {
    &[data-home-card] {
      position: relative;
      padding: 0;
      border: 0;
      border-radius: 0;
      box-shadow: none;

      [data-thumbnail] {
        max-width: none;
        margin-bottom: 8px;
        border: 0;
        border-radius: 12px;
      }

      [data-status] {
        position: absolute;
        top: 10px;
        left: 10px;
      }
    }
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
  aspect-ratio: 205 / 205;
  margin-bottom: 12px;
  overflow: hidden;
  place-items: center;
  border: 1px solid #ececef;
  border-radius: 16px;
  background: #f3f3f5;
`;

const Image = styled.img`
  display: block;
  width: 100%;
  height: auto;
  min-width: 0;
  min-height: 0;
  aspect-ratio: 1 / 1;
  object-fit: cover;
`;

const CardContent = styled.div`
  display: flex;
  min-width: 0;
  padding: 0 4px;

  @media (max-width: 767px) {
    [data-home-card] & {
      padding: 0;
      gap: 2px;
    }

    [data-home-card] & h3 {
      font-size: 15px;
      line-height: 20px;
      font-weight: 700;
    }

    [data-home-card] & p {
      font-size: 12px;
      line-height: 16px;
    }
  }

  @media (min-width: 768px) {
    [data-home-card] & {
      padding: 0;
    }
  }
  flex: 1;
  flex-direction: column;
`;

const PrimaryInfo = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12px;

  @media (max-width: 767px) {
    [data-home-card] & {
      gap: 2px;
    }
  }

  @media (min-width: 768px) {
    [data-home-card] & {
      gap: 4px;
    }
  }
`;

const TradeInfo = styled.div`
  display: flex;
  min-width: 0;
  margin-top: auto;
  padding-top: 12px;

  @media (min-width: 768px) {
    [data-home-card] & {
      margin-top: 0;
      padding-top: 4px;
    }
  }
  flex-direction: column;
  gap: 12px;

  @media (max-width: 767px) {
    [data-home-card] & {
      display: grid;
      grid-template-columns: minmax(0, max-content) max-content minmax(0, 1fr);
      gap: 0 4px;
      margin-top: 0;
      padding-top: 0;

      & > p + p::before {
        content: '·';
        margin-right: 6px;
      }
    }
  }

  @media (min-width: 768px) {
    [data-home-card] & {
      gap: 4px;
    }
  }
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

  @media (max-width: 767px) {
    [data-home-card] & {
      -webkit-line-clamp: 1;
    }
  }
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

  @media (max-width: 767px) {
    [data-home-card] & {
      -webkit-line-clamp: 1;
    }
  }
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

  @media (max-width: 767px) {
    [data-home-card] & {
      grid-column: 1 / -1;
      width: 100%;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
      margin-top: 6px;

      [data-status] > span {
        box-sizing: border-box;
        min-height: 22px;
        padding: 0 8px;
        gap: 4px;
        font-size: 11px;
        line-height: 16px;
      }

      [data-status] > span > span {
        width: 5px;
        height: 5px;
      }
    }
  }
`;

const Engagement = styled.span`
  display: inline-flex;
  gap: 8px;
  color: #777173;
  font-size: 12px;
  line-height: 17px;

  > span {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
  }
`;
