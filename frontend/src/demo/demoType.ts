export interface DemoProduct {
  id: number;
  name: string;
  image: string;
  categories: readonly string[];
  samplePrice: number;
  sampleStoreIds: readonly number[];
}

export interface DemoStore {
  id: number;
  name: string;
  address: string;
  image: string;
  gallery: readonly string[];
  sampleDistance: string;
  sampleMachineCount: number;
  samplePriceRange: string;
  sampleOpen: boolean;
  pin: { x: number; y: number };
}

export interface DemoListing {
  id: number;
  productId: number;
  title: string;
  neighborhood: string;
  samplePrice: number;
  sampleTime: string;
}
