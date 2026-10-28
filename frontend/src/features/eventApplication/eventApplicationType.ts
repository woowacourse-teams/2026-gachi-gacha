export type EventApplicationTrack = 'BASIC' | 'COMPLETED' | 'BOTH';

export interface EventApplicationInput {
  eventId: 'popular-goods-giveaway-2026';
  memberId: string;
  desiredTrack: EventApplicationTrack;
  instagramId: string;
  tradeId: number;
  tradeUrl: string;
  completedTradeId: number | null;
  completedTradeUrl: string | null;
  privacyConsent: true;
}
