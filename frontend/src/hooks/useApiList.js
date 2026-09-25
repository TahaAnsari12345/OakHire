import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';

const DEFAULT_PAGINATION = { page: 1, limit: 10, total: 0, totalPages: 1 };

export default function useApiList(endpoint, initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const params = { ...filters, page, limit: 10 };
        Object.keys(params).forEach((key) => {
          if (params[key] === '' || params[key] === undefined) delete params[key];
        });
        const { data: response } = await api.get(endpoint, { params });
        if (cancelled) return;
        setData(response.data);
        setPagination(response.pagination);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [endpoint, filters, page, reloadToken]);

  function updateFilters(nextFilters) {
    setFilters(nextFilters);
    setPage(1);
  }

  return { data, pagination, page, setPage, filters, updateFilters, isLoading, error, refetch };
}
