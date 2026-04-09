import { useState, useCallback, useEffect, useRef } from 'react';
import { billingService } from '../services/billing.service';
import { getMockInvoices, getMockInvoiceById, getMockBillingSummary } from '../data/mockInvoices';
import {
  INVOICE_PAGINATION,
  INVOICE_FILTER_OPTIONS,
  INVOICE_SORT_OPTIONS,
} from '../constants/billing';

/**
 * Manages invoice list state including fetching, filtering, pagination, and actions.
 *
 * @param {Object} [options]
 * @param {string} [options.patientId] - Scope invoices to a specific patient.
 * @returns {{
 *   invoices: Array,
 *   summary: Object|null,
 *   selectedInvoice: Object|null,
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
 *   fetchInvoiceDetail: Function,
 *   closeDetail: Function,
 *   refetch: Function,
 * }}
 */
export const useBilling = ({ patientId } = {}) => {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(INVOICE_PAGINATION.DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(INVOICE_PAGINATION.DEFAULT_LIMIT);

  const [filters, setFilters] = useState({
    status: INVOICE_FILTER_OPTIONS.ALL,
    sort: INVOICE_SORT_OPTIONS.DATE_DESC,
    search: '',
    from: '',
    to: '',
  });

  const abortControllerRef = useRef(null);

  /**
   * Fetch invoices with current filters, pagination, and optional patientId scope.
   */
  const fetchInvoices = useCallback(async () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        sort: filters.sort,
      };

      if (patientId) params.patientId = patientId;
      if (filters.status !== INVOICE_FILTER_OPTIONS.ALL) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const data = await billingService.getInvoices(params);
      setInvoices(data.data || []);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      if (err.name === 'AbortError') return;
      // Fall back to mock data when backend is not available
      if (err.status === 404) {
        const mockData = getMockInvoices({ patientId, status: filters.status, search: filters.search });
        setInvoices(mockData);
        setTotalCount(mockData.length);
        return;
      }
      setError(err.message || 'Failed to fetch invoices');
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters, patientId]);

  /**
   * Fetch billing summary.
   */
  const fetchSummary = useCallback(async () => {
    try {
      const data = await billingService.getBillingSummary();
      setSummary(data.data || null);
    } catch (err) {
      if (err.status === 404) {
        setSummary(getMockBillingSummary());
        return;
      }
      console.error('Error fetching billing summary:', err);
    }
  }, []);

  /**
   * Fetch single invoice detail.
   */
  const fetchInvoiceDetail = useCallback(async (id) => {
    try {
      const data = await billingService.getInvoiceById(id);
      setSelectedInvoice(data.data || null);
    } catch (err) {
      if (err.status === 404) {
        setSelectedInvoice(getMockInvoiceById(id));
        return;
      }
      console.error('Error fetching invoice detail:', err);
    }
  }, []);

  const closeDetail = useCallback(() => setSelectedInvoice(null), []);

  useEffect(() => {
    fetchInvoices();
    return () => abortControllerRef.current?.abort();
  }, [fetchInvoices]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  /**
   * Update filters and reset to page 1.
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(INVOICE_PAGINATION.DEFAULT_PAGE);
  }, []);

  /**
   * Clear all filters and reset pagination.
   */
  const clearFilters = useCallback(() => {
    setFilters({
      status: INVOICE_FILTER_OPTIONS.ALL,
      sort: INVOICE_SORT_OPTIONS.DATE_DESC,
      search: '',
      from: '',
      to: '',
    });
    setCurrentPage(INVOICE_PAGINATION.DEFAULT_PAGE);
  }, []);

  /**
   * Manually refetch invoices and summary.
   */
  const refetch = useCallback(() => {
    fetchInvoices();
    fetchSummary();
  }, [fetchInvoices, fetchSummary]);

  return {
    invoices,
    summary,
    selectedInvoice,
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
    fetchInvoiceDetail,
    closeDetail,
    refetch,
  };
};
