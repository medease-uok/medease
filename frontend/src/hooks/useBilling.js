import { useState, useCallback, useEffect, useRef } from 'react';
import { billingService } from '../services/billing.service';
import { getMockInvoices, getMockInvoiceById, getMockBillingSummary } from '../data/mockInvoices';
import {
  INVOICE_PAGINATION,
  INVOICE_FILTER_OPTIONS,
  INVOICE_SORT_OPTIONS,
} from '../constants/billing';

/**
 * Manages invoice list state including fetching, filtering, pagination, and
 * CRUD management actions (create, update status, record payment, delete).
 *
 * Since the backend is not available, all management actions operate on
 * local in-memory state. Once the backend ships, the action handlers simply
 * need to call the service and then refetch.
 *
 * @param {Object} [options]
 * @param {string} [options.patientId] - Scope invoices to a specific patient.
 */
export const useBilling = ({ patientId } = {}) => {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

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

  // ─── Helper: auto-dismiss success messages ───
  const showSuccess = useCallback((msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  // ─── Helper: recompute summary from local invoices ───
  const recomputeSummary = useCallback((list) => {
    const active = list.filter((inv) => inv.status !== 'void' && inv.status !== 'cancelled');
    const totalBilled = active.reduce((s, inv) => s + inv.total, 0);
    const totalCollected = active.reduce((s, inv) => s + inv.amountPaid, 0);
    const totalOutstanding = totalBilled - totalCollected;
    const overdueCount = list.filter((inv) => inv.status === 'overdue').length;
    const draftCount = list.filter((inv) => inv.status === 'draft').length;
    setSummary({ totalBilled, totalCollected, totalOutstanding, overdueCount, draftCount, invoiceCount: list.length });
  }, []);

  // ─── Fetch invoices ───
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

  // ─── Fetch summary ───
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

  // ─── Fetch invoice detail ───
  const fetchInvoiceDetail = useCallback((id) => {
    // Check local state first (for newly created / updated invoices)
    const local = invoices.find((inv) => inv.id === id);
    if (local) {
      setSelectedInvoice(local);
      return;
    }
    // Fall back to mock lookup
    setSelectedInvoice(getMockInvoiceById(id));
  }, [invoices]);

  const closeDetail = useCallback(() => setSelectedInvoice(null), []);

  // ─── Effects ───
  useEffect(() => {
    fetchInvoices();
    return () => abortControllerRef.current?.abort();
  }, [fetchInvoices]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // ─── Filter helpers ───
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(INVOICE_PAGINATION.DEFAULT_PAGE);
  }, []);

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

  const refetch = useCallback(() => {
    fetchInvoices();
    fetchSummary();
  }, [fetchInvoices, fetchSummary]);

  // ═══════════════════════════════════════════════════════════
  // MANAGEMENT ACTIONS (in-memory, for frontend-only mode)
  // ═══════════════════════════════════════════════════════════

  /**
   * Create a new invoice (in-memory).
   * @param {Object} invoiceData - { patientId, patientName, doctorName, items, discount, notes }
   */
  const createInvoice = useCallback((invoiceData) => {
    const now = new Date().toISOString();
    const dueDate = new Date(Date.now() + 14 * 86400000).toISOString();
    const itemsWithIds = (invoiceData.items || []).map((item, idx) => ({
      ...item,
      id: `li-new-${Date.now()}-${idx}`,
      total: item.quantity * item.unitPrice,
    }));
    const subtotal = itemsWithIds.reduce((s, i) => s + i.total, 0);
    const discount = Number(invoiceData.discount) || 0;
    const total = subtotal - discount;

    const newInvoice = {
      id: `inv-new-${Date.now()}`,
      invoiceNumber: `INV-2026-${String(invoices.length + 16).padStart(4, '0')}`,
      patientId: invoiceData.patientId || '',
      patientName: invoiceData.patientName || '',
      doctorName: invoiceData.doctorName || '',
      status: 'draft',
      paymentMethod: null,
      issueDate: now,
      dueDate,
      paidDate: null,
      subtotal,
      tax: 0,
      discount,
      total,
      amountPaid: 0,
      notes: invoiceData.notes || '',
      items: itemsWithIds,
    };

    setInvoices((prev) => {
      const next = [newInvoice, ...prev];
      recomputeSummary(next);
      return next;
    });
    showSuccess(`Invoice ${newInvoice.invoiceNumber} created as draft.`);
    return newInvoice;
  }, [invoices.length, recomputeSummary, showSuccess]);

  /**
   * Update the status of an invoice (in-memory).
   * @param {string} id
   * @param {string} newStatus
   * @param {string} [paymentMethod]
   */
  const updateInvoiceStatus = useCallback((id, newStatus, paymentMethod) => {
    setInvoices((prev) => {
      const next = prev.map((inv) => {
        if (inv.id !== id) return inv;
        const update = { ...inv, status: newStatus };
        if (newStatus === 'paid') {
          update.paidDate = new Date().toISOString();
          update.amountPaid = inv.total;
          if (paymentMethod) update.paymentMethod = paymentMethod;
        }
        if (newStatus === 'void' || newStatus === 'cancelled') {
          update.amountPaid = 0;
          update.paidDate = null;
        }
        return update;
      });
      recomputeSummary(next);
      return next;
    });
    // Also update selectedInvoice if it's open
    setSelectedInvoice((prev) => {
      if (!prev || prev.id !== id) return prev;
      const update = { ...prev, status: newStatus };
      if (newStatus === 'paid') {
        update.paidDate = new Date().toISOString();
        update.amountPaid = prev.total;
        if (paymentMethod) update.paymentMethod = paymentMethod;
      }
      if (newStatus === 'void' || newStatus === 'cancelled') {
        update.amountPaid = 0;
        update.paidDate = null;
      }
      return update;
    });
    const statusLabels = { paid: 'Paid', sent: 'Sent', void: 'Voided', cancelled: 'Cancelled', overdue: 'Overdue' };
    showSuccess(`Invoice marked as ${statusLabels[newStatus] || newStatus}.`);
  }, [recomputeSummary, showSuccess]);

  /**
   * Record a partial payment (in-memory).
   * @param {string} id
   * @param {number} amount
   * @param {string} [paymentMethod]
   */
  const recordPayment = useCallback((id, amount, paymentMethod) => {
    setInvoices((prev) => {
      const next = prev.map((inv) => {
        if (inv.id !== id) return inv;
        const newPaid = inv.amountPaid + Number(amount);
        const fullyPaid = newPaid >= inv.total;
        return {
          ...inv,
          amountPaid: fullyPaid ? inv.total : newPaid,
          status: fullyPaid ? 'paid' : 'partially_paid',
          paidDate: fullyPaid ? new Date().toISOString() : null,
          paymentMethod: paymentMethod || inv.paymentMethod,
        };
      });
      recomputeSummary(next);
      return next;
    });
    setSelectedInvoice((prev) => {
      if (!prev || prev.id !== id) return prev;
      const newPaid = prev.amountPaid + Number(amount);
      const fullyPaid = newPaid >= prev.total;
      return {
        ...prev,
        amountPaid: fullyPaid ? prev.total : newPaid,
        status: fullyPaid ? 'paid' : 'partially_paid',
        paidDate: fullyPaid ? new Date().toISOString() : null,
        paymentMethod: paymentMethod || prev.paymentMethod,
      };
    });
    showSuccess(`Payment of LKR ${Number(amount).toLocaleString()} recorded.`);
  }, [recomputeSummary, showSuccess]);

  /**
   * Delete an invoice (in-memory, only allowed for drafts).
   * @param {string} id
   */
  const deleteInvoice = useCallback((id) => {
    setInvoices((prev) => {
      const next = prev.filter((inv) => inv.id !== id);
      recomputeSummary(next);
      return next;
    });
    setSelectedInvoice((prev) => (prev?.id === id ? null : prev));
    showSuccess('Invoice deleted.');
  }, [recomputeSummary, showSuccess]);

  return {
    // State
    invoices,
    summary,
    selectedInvoice,
    totalCount,
    loading,
    error,
    successMessage,
    // Pagination
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    // Filters
    filters,
    updateFilters,
    clearFilters,
    // Detail
    fetchInvoiceDetail,
    closeDetail,
    refetch,
    // Management actions
    createInvoice,
    updateInvoiceStatus,
    recordPayment,
    deleteInvoice,
  };
};
