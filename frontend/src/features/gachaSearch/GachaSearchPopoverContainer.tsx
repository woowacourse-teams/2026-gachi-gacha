import { GachaSearchPopover } from './GachaSearchPopover';
import { useGachaSearch } from './useGachaSearch';

export interface GachaSearchPopoverContainerProps {
  query: string;
  onClose: () => void;
  onSelect: (gachaId: number) => void;
}

export function GachaSearchPopoverContainer({
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
