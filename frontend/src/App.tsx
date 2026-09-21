import { SearchRoute } from '@/routes/search/route';

export default function App() {
  if (window.location.pathname === '/search') {
    return <SearchRoute />;
  }

  return null;
}
