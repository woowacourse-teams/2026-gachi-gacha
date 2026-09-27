export interface SecondhandDetail {
  id: number;
  imageUrls: string[];
  title: string;
  category: string;
  status: string;
  postedAt: string;
  viewCount: number;
  wishCount: number;
  wantedTrade: string;
  place: string;
  availableTime: string;
  description: string;
  seller: {
    nickname: string;
    neighborhood: string;
    completedTradeCount: number;
  };
}
