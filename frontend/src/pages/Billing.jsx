import { useState } from 'react';
import {
  Receipt, Search, RefreshCw, Filter, X, Eye,
  DollarSign, AlertTriangle, CheckCircle, FileText,
  ChevronLeft, ChevronRight, Clock, TrendingUp,
} from 'lucide-react';
import { useBilling } from '../hooks/useBilling';
import {
  getInvoiceStatusConfig,
  INVOICE_STATUS,
  INVOICE_FILTER_OPTIONS,
  LINE_ITEM_LABELS,
  PAYMENT_METHOD_CONFIG,
  formatCurrency,
} from '../constants/billing';

/* ─── Format date helper ─── */
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

/* ─── Summary Card ─── */
function SummaryCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

/* ─── Status Badge ─── */
function InvoiceStatusBadge({ status }) {
  const config = getInvoiceStatusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badgeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
}

/* ─── Invoice Detail Modal ─── */
function InvoiceDetailModal({ invoice, onClose }) {
  if (!invoice) return null;

  const methodConfig = invoice.paymentMethod ? PAYMENT_METHOD_CONFIG[invoice.paymentMethod] : null;
  const SubtotalCalc = (invoice.items || []).reduce((s, i) => s + i.total, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{invoice.invoiceNumber}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{invoice.patientName}</p>
          </div>
          <div className="flex items-center gap-3">
            <InvoiceStatusBadge status={invoice.status} />
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="p-6 grid grid-cols-2 gap-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Doctor</p>
            <p className="text-sm font-medium text-slate-700">{invoice.doctorName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Payment Method</p>
            <p className="text-sm font-medium text-slate-700">
              {methodConfig ? methodConfig.label : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Issue Date</p>
            <p className="text-sm font-medium text-slate-700">{fmtDate(invoice.issueDate)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Due Date</p>
            <p className="text-sm font-medium text-slate-700">{fmtDate(invoice.dueDate)}</p>
          </div>
          {invoice.paidDate && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Paid Date</p>
              <p className="text-sm font-medium text-green-700">{fmtDate(invoice.paidDate)}</p>
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="p-6">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Line Items</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="pb-2 pr-4">Description</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4 text-right">Qty</th>
                <th className="pb-2 pr-4 text-right">Unit Price</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item) => (
                <tr key={item.id} className="border-b border-slate-50">
                  <td className="py-3 pr-4 font-medium text-slate-700">{item.description}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {LINE_ITEM_LABELS[item.type] || item.type}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right text-slate-600">{item.quantity}</td>
                  <td className="py-3 pr-4 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 text-right font-semibold text-slate-900">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(SubtotalCalc)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div className="flex justify-between text-sm text-slate-500">
                <span>Tax</span>
                <span>{formatCurrency(invoice.tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
            {invoice.amountPaid > 0 && invoice.amountPaid < invoice.total && (
              <>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Amount Paid</span>
                  <span>{formatCurrency(invoice.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-amber-600">
                  <span>Balance Due</span>
                  <span>{formatCurrency(invoice.total - invoice.amountPaid)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="px-6 pb-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Billing Page ─── */
export default function Billing() {
  const {
    invoices,
    summary,
    selectedInvoice,
    loading,
    error,
    currentPage,
    setCurrentPage,
    pageSize,
    filters,
    updateFilters,
    clearFilters,
    fetchInvoiceDetail,
    closeDetail,
    refetch,
  } = useBilling();

  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };

  const totalPages = Math.ceil((summary?.invoiceCount || invoices.length) / pageSize);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Billing & Invoices</h1>
            <p className="text-sm text-slate-500">View and manage patient invoices</p>
          </div>
        </div>
        <button
          onClick={refetch}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            icon={DollarSign}
            label="Total Billed"
            value={formatCurrency(summary.totalBilled)}
            color="bg-blue-100 text-blue-600"
            sub={`${summary.invoiceCount} invoices`}
          />
          <SummaryCard
            icon={CheckCircle}
            label="Collected"
            value={formatCurrency(summary.totalCollected)}
            color="bg-green-100 text-green-600"
          />
          <SummaryCard
            icon={TrendingUp}
            label="Outstanding"
            value={formatCurrency(summary.totalOutstanding)}
            color="bg-amber-100 text-amber-600"
          />
          <SummaryCard
            icon={AlertTriangle}
            label="Overdue"
            value={summary.overdueCount}
            color="bg-red-100 text-red-600"
            sub={summary.draftCount > 0 ? `${summary.draftCount} drafts` : undefined}
          />
        </div>
      )}

      {/* Search & Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice #, patient, or doctor..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
            />
          </form>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              showFilters ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          {(filters.status !== INVOICE_FILTER_OPTIONS.ALL || filters.search || filters.from || filters.to) && (
            <button
              onClick={() => { clearFilters(); setSearchInput(''); }}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Expandable filter section */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={filters.status}
                onChange={(e) => updateFilters({ status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="all">All Statuses</option>
                {Object.values(INVOICE_STATUS).map((s) => (
                  <option key={s} value={s}>
                    {getInvoiceStatusConfig(s).label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">From Date</label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => updateFilters({ from: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">To Date</label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => updateFilters({ to: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FileText className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium">No invoices found</p>
            <p className="text-xs">Try adjusting your filters</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice #</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Doctor</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Due</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => fetchInvoiceDetail(inv.id)}
                >
                  <td className="px-5 py-4">
                    <span className="font-bold text-slate-900">{inv.invoiceNumber}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{inv.patientName}</td>
                  <td className="px-5 py-4 text-slate-600">{inv.doctorName}</td>
                  <td className="px-5 py-4">
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-bold text-slate-900">{formatCurrency(inv.total)}</span>
                    {inv.status === 'partially_paid' && (
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        {formatCurrency(inv.total - inv.amountPaid)} due
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{fmtDate(inv.issueDate)}</td>
                  <td className="px-5 py-4">
                    <span className={
                      inv.status === 'overdue'
                        ? 'text-red-600 font-semibold'
                        : 'text-slate-600'
                    }>
                      {fmtDate(inv.dueDate)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); fetchInvoiceDetail(inv.id); }}
                      className="p-2 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {invoices.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs text-slate-500">
              Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, invoices.length)} of {invoices.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-xs font-medium text-slate-600">
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages || 1, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <InvoiceDetailModal invoice={selectedInvoice} onClose={closeDetail} />
    </div>
  );
}
