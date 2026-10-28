import { GachaSearchPopover } from './GachaSearchPopover';
import { useGachaSearch } from './useGachaSearch';

export interface GachaSearchPopoverContainerProps {
  id?: string;
  query: string;
  onClose: () => void;
  onSelect: (gachaId: number) => void;
}

export function GachaSearchPopoverContainer({
  id,
  query,
  onClose,
  onSelect,
}: GachaSearchPopoverContainerProps) {
  const {
    searchState,
    hasMore,
    isLoadingMore,
    loadMoreErrorMessage,
    retrySearch,
    loadMore,
  } = useGachaSearch(query);

  return (
    <GachaSearchPopover
      {...(id ? { id } : {})}
      query={query}
      searchState={searchState}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      loadMoreErrorMessage={loadMoreErrorMessage}
      onClose={onClose}
      onLoadMore={loadMore}
      onRetry={retrySearch}
      onSelect={onSelect}
    />
  );
}
