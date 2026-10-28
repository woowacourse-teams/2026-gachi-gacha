import { GachaSearchNavigationBar } from '@/features/gachaSearch/GachaSearchNavigationBar';
import { SearchHeroLayout } from '@/shared/ui/SearchHeroLayout';

export default function SearchHero() {
  return (
    <SearchHeroLayout title="오늘은 어떤 가챠를 찾아볼까요?">
      <GachaSearchNavigationBar />
    </SearchHeroLayout>
  );
}
