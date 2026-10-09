export type EventApplicationTrack = 'BASIC' | 'COMPLETED';

export interface EventApplicationInput {
  eventId: 'popular-goods-giveaway-2026';
  memberId: string;
  desiredTrack: EventApplicationTrack;
  instagramId: string;
  tradeId: number;
  tradeUrl: string;
  privacyConsent: true;
}
