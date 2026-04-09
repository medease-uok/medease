import { useState, useCallback, useEffect, useRef } from 'react';
import { paymentsService } from '../services/payments.service';
import {
  PAYMENT_PAGINATION,
  PAYMENT_FILTER_OPTIONS,
  PAYMENT_SORT_OPTIONS,
} from '../constants/payments';

export const usePayments = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(PAYMENT_PAGINATION.DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(PAYMENT_PAGINATION.DEFAULT_LIMIT);

  const [filters, setFilters] = useState({
    status: PAYMENT_FILTER_OPTIONS.ALL,
    category: null,
    method: null,
    sort: PAYMENT_SORT_OPTIONS.DATE_DESC,
    search: '',
    from: '',
    to: '',
  });

  const fetchInProgressRef = useRef(false);

  /**
   * Fetch payments with current filters and pagination
   */
  const fetchPayments = useCallback(async () => {
    if (fetchInProgressRef.current) return;

    fetchInProgressRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        sort: filters.sort,
      };

      if (filters.status !== PAYMENT_FILTER_OPTIONS.ALL) {
        params.status = filters.status;
      }
      if (filters.category) {
        params.category = filters.category;
      }
      if (filters.method) {
        params.method = filters.method;
      }
      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.from) {
        params.from = filters.from;
      }
      if (filters.to) {
        params.to = filters.to;
      }

      const data = await paymentsService.getPayments(params);
      setPayments(data.data || []);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch payment history');
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [currentPage, pageSize, filters]);

  /**
   * Fetch payment summary (totals by status)
   */
  const fetchSummary = useCallback(async () => {
    try {
      const data = await paymentsService.getPaymentSummary();
      setSummary(data.data || null);
    } catch (err) {
      console.error('Error fetching payment summary:', err);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  /**
   * Update filters and reset to page 1
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(PAYMENT_PAGINATION.DEFAULT_PAGE);
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      status: PAYMENT_FILTER_OPTIONS.ALL,
      category: null,
      method: null,
      sort: PAYMENT_SORT_OPTIONS.DATE_DESC,
      search: '',
      from: '',
      to: '',
    });
    setCurrentPage(PAYMENT_PAGINATION.DEFAULT_PAGE);
  }, []);

  /**
   * Export payments
   */
  const handleExport = useCallback(async (format = 'csv') => {
    try {
      const params = { format };
      if (filters.status !== PAYMENT_FILTER_OPTIONS.ALL) {
        params.status = filters.status;
      }
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const blob = await paymentsService.exportPayments(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment_history_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export payments. Please try again.');
    }
  }, [filters]);

  return {
    payments,
    summary,
    totalCount,
    loading,
    error,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    filters,
    updateFilters,
    clearFilters,
    handleExport,
    refetch: fetchPayments,
  };
};
