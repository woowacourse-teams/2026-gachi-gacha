export interface TradePlaceInput {
  name?: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface CreateTradeRequest {
  title: string;
  categoryIds?: number[];
  description?: string;
  desiredProduction?: string;
  purchaseStore?: TradePlaceInput;
  tradePlace?: TradePlaceInput;
  availableTime?: string;
}
