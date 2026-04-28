import { useState, useMemo } from 'react';

/**
 * Hook to manage local or server-side pagination state
 */
export function usePagination(initialPage = 1, initialLimit = 10) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const onPageChange = (page) => setCurrentPage(page);
  const onLimitChange = (newLimit) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page on limit change
  };

  return {
    currentPage,
    limit,
    onPageChange,
    onLimitChange,
    setCurrentPage
  };
}

export default usePagination;
