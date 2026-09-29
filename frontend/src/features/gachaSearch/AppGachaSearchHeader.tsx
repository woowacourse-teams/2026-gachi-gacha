import { AppHeader } from '@/shared/ui/AppHeader';

import { GachaSearchNavigationBar } from './GachaSearchNavigationBar';

interface AppGachaSearchHeaderProps {
  currentPath: string;
}

export function AppGachaSearchHeader({
  currentPath,
}: AppGachaSearchHeaderProps) {
  return (
    <AppHeader
      currentPath={currentPath}
      search={<GachaSearchNavigationBar />}
    />
  );
}
