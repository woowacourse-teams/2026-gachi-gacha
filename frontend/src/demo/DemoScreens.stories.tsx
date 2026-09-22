import { useState } from 'react';
import { Global } from '@emotion/react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { demoStyles } from './demoStyles';
import type { DemoRoute } from './hooks/useDemoNavigation';
import { readDemoRoute } from './hooks/useDemoNavigation';
import { HomePage } from './pages/HomePage';
import { MarketPage } from './pages/MarketPage';
import { SearchPage } from './pages/SearchPage';
import { StorePage } from './pages/StorePage';
import { Header } from './ui/Header';
import { InfoDialog } from './ui/InfoDialog';

function DemoScreens({
  initialPage = 'home',
}: {
  initialPage?: 'home' | 'search' | 'store' | 'market';
}) {
  const [route, setRoute] = useState<DemoRoute>(() =>
    initialPage === 'search'
      ? { page: 'search', productId: 3533 }
      : initialPage === 'store'
        ? { page: 'store', storeId: 1 }
        : { page: initialPage },
  );
  const [likes, setLikes] = useState<ReadonlySet<number>>(() => new Set());
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const navigate = (href: string) =>
    setRoute(readDemoRoute(new URL(href, 'https://demo.invalid')));
  const notify = (title: string, message: string) =>
    setNotice({ title, message });
  function onLike(id: number) {
    setLikes((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  return (
    <div className="promo">
      <Global styles={demoStyles} />
      <Header
        page={route.page}
        navigate={navigate}
        onProductSelect={(product) =>
          navigate('/demo/search?gachaId=' + product.id)
        }
        notify={notify}
      />
      {route.page === 'home' && (
        <HomePage
          navigate={navigate}
          onProductSelect={(product) =>
            navigate('/demo/search?gachaId=' + product.id)
          }
          likes={likes}
          onLike={onLike}
          notify={notify}
        />
      )}
      {route.page === 'search' && (
        <SearchPage
          key={route.productId ?? 'map'}
          productId={route.productId}
          navigate={navigate}
          notify={notify}
        />
      )}
      {route.page === 'store' && (
        <StorePage
          key={route.storeId}
          storeId={route.storeId}
          navigate={navigate}
          likes={likes}
          onLike={onLike}
          notify={notify}
        />
      )}
      {route.page === 'market' && <MarketPage notify={notify} />}
      {notice && <InfoDialog {...notice} onClose={() => setNotice(null)} />}
    </div>
  );
}

const meta = {
  title: 'Demo/홍보용 화면',
  component: DemoScreens,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof DemoScreens>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = { args: { initialPage: 'home' } };
export const SearchResults: Story = { args: { initialPage: 'search' } };
export const StoreDetail: Story = { args: { initialPage: 'store' } };
export const UsedMarket: Story = { args: { initialPage: 'market' } };
