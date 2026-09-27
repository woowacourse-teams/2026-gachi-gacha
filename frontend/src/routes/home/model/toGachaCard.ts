import type { GachaCard } from './gachaCard';
import type { CategoryGachaDto } from '../api/categoryGacha.dto';

export function toGachaCard(dto: CategoryGachaDto): GachaCard {
  return {
    id: dto.gachaId,
    name: dto.name,
    imageUrl: dto.thumbnailUrl,
  };
}
