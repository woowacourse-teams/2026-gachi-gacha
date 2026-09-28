export interface SecondhandItem {
  id: number;
  title: string;
  price: number | null;
  neighborhood: string;
  postedAt: string;
  imageUrl?: string;
  badge?: string;
}
