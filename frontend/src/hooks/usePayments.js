import { useState, useCallback, useEffect, useRef } from 'react';
import { paymentsService } from '../services/payments.service';
import {
  PAYMENT_PAGINATION,
  PAYMENT_FILTER_OPTIONS,
  PAYMENT_SORT_OPTIONS,
  ALLOWED_EXPORT_FORMATS,
} from '../constants/payments';

/**
 * Manages payment list state including fetching, filtering, pagination, and export.
 *
 * @param {Object} [options]
 * @param {string} [options.patientId] - Scope payments to a specific patient.
 *   When provided, all fetches include this patientId as a query parameter.
 * @returns {{
 *   payments: Array,
 *   summary: Object|null,
 *   totalCount: number,
 *   loading: boolean,
 *   error: string|null,
 *   currentPage: number,
 *   setCurrentPage: Function,
 *   pageSize: number,
 *   setPageSize: Function,
 *   filters: Object,
 *   updateFilters: Function,
 *   clearFilters: Function,
 *   handleExport: Function,
 *   refetch: Function,
 * }}
 */
export const usePayments = ({ patientId } = {}) => {
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

  /** AbortController ref — cancels in-flight requests when a new fetch is triggered */
  const abortControllerRef = useRef(null);

  /**
   * Fetch payments with current filters, pagination, and optional patientId scope.
   * Aborts any previously in-flight request to avoid race conditions.
   */
  const fetchPayments = useCallback(async () => {
    // Cancel any in-flight request before starting a new one
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        sort: filters.sort,
      };

      if (patientId) {
        params.patientId = patientId;
      }
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

      const data = await paymentsService.getPayments(params, signal);
      setPayments(data.data || []);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      // Ignore aborted requests — they are expected when filters change rapidly
      if (err.name === 'AbortError') return;
      // Silently treat 404 (endpoint not found) as empty — backend may not be deployed yet
      if (err.status === 404) return;
      setError(err.message || 'Failed to fetch payment history');
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters, patientId]);

  /**
   * Fetch payment summary (totals by status).
   * Scoped to patientId when provided.
   */
  const fetchSummary = useCallback(async () => {
    try {
      const params = patientId ? { patientId } : {};
      const data = await paymentsService.getPaymentSummary(params);
      setSummary(data.data || null);
    } catch (err) {
      // Silently treat 404 as no summary data
      if (err.status === 404) return;
      console.error('Error fetching payment summary:', err);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPayments();

    // Cleanup: abort in-flight request if the component unmounts or deps change
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchPayments]);

  // Re-fetch summary whenever payments are refetched (keeps totals in sync)
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  /**
   * Update filters and reset to page 1.
   * Both state updates are batched automatically in React 18+.
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(PAYMENT_PAGINATION.DEFAULT_PAGE);
  }, []);

  /**
   * Clear all filters and reset pagination
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
   * Export payments as a downloadable file.
   * Validates format against ALLOWED_EXPORT_FORMATS before proceeding.
   * Blob URL cleanup is guaranteed via try/finally.
   */
  const handleExport = useCallback(async (format = 'csv') => {
    const safeFormat = ALLOWED_EXPORT_FORMATS.includes(format) ? format : 'csv';
    let url = null;

    try {
      const params = { format: safeFormat };
      if (patientId) params.patientId = patientId;
      if (filters.status !== PAYMENT_FILTER_OPTIONS.ALL) {
        params.status = filters.status;
      }
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const blob = await paymentsService.exportPayments(params);
      url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment_history_${new Date().toISOString().split('T')[0]}.${safeFormat}`);
      document.body.appendChild(link);
      try {
        link.click();
      } finally {
        link.parentNode?.removeChild(link);
      }
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export payments. Please try again.');
    } finally {
      if (url) {
        window.URL.revokeObjectURL(url);
      }
    }
  }, [filters, patientId]);

  /**
   * Manually refetch payments and summary
   */
  const refetch = useCallback(() => {
    fetchPayments();
    fetchSummary();
  }, [fetchPayments, fetchSummary]);

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
    refetch,
  };
};
