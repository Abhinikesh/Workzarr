import { useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Sync state with URL query parameters for filter persistence
 */
export function useQueryParams() {
  const { search, pathname } = useLocation();
  const navigate = useNavigate();

  const queryParams = useMemo(() => {
    return Object.fromEntries(new URLSearchParams(search));
  }, [search]);

  const setQueryParams = useCallback((params) => {
    const searchParams = new URLSearchParams(search);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        searchParams.delete(key);
      } else {
        searchParams.set(key, value);
      }
    });

    navigate({ pathname, search: searchParams.toString() }, { replace: true });
  }, [search, pathname, navigate]);

  const clearQueryParams = useCallback(() => {
    navigate({ pathname, search: '' }, { replace: true });
  }, [pathname, navigate]);

  return { queryParams, setQueryParams, clearQueryParams };
}

export default useQueryParams;
