import { useState } from 'react';
import {
  CreditCard,
  Search,
  RefreshCw,
  Download,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Clock,
  Filter,
  X,
  Receipt,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { usePayments } from '../hooks/usePayments';
import {
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  PAYMENT_CATEGORIES,
  PAYMENT_SORT_OPTIONS,
  PAYMENT_PAGINATION,
  CATEGORY_LABELS,
  getStatusConfig,
  getMethodConfig,
} from '../constants/payments';

const formatCurrency = (amount) => {
  if (amount == null) return 'LKR 0.00';
  return `LKR ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatDateTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function SummaryCard({ icon: Icon, label, value, subtext, gradient }) {
  return (
    <div className={`rounded-2xl p-5 text-white ${gradient} shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtext && <p className="text-xs opacity-70 mt-1">{subtext}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badgeClass}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function PaymentMethodDisplay({ method }) {
  const config = getMethodConfig(method);
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${config.color}`} />
      <span className="text-sm text-slate-700">{config.label}</span>
    </div>
  );
}

function PaymentDetailModal({ payment, onClose }) {
  if (!payment) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Payment Details
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Transaction ID</span>
            <span className="font-mono text-sm text-slate-900">
              {payment.id ? `#${payment.id.substring(0, 8).toUpperCase()}` : '—'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Status</span>
            <StatusBadge status={payment.status} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Amount</span>
            <span className="text-lg font-bold text-slate-900">{formatCurrency(payment.amount)}</span>
          </div>

          <hr className="border-slate-100" />

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Category</span>
            <span className="text-sm text-slate-700">{CATEGORY_LABELS[payment.category] || payment.category || '—'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Payment Method</span>
            {payment.payment_method ? (
              <PaymentMethodDisplay method={payment.payment_method} />
            ) : (
              <span className="text-sm text-slate-400">—</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Date</span>
            <span className="text-sm text-slate-700">{formatDateTime(payment.created_at)}</span>
          </div>

          {payment.description && (
            <>
              <hr className="border-slate-100" />
              <div>
                <span className="text-sm text-slate-500 block mb-1">Description</span>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{payment.description}</p>
              </div>
            </>
          )}

          {payment.reference_number && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Reference</span>
              <span className="font-mono text-sm text-slate-700">{payment.reference_number}</span>
            </div>
          )}

          {payment.doctor_name && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Doctor</span>
              <span className="text-sm text-slate-700">Dr. {payment.doctor_name}</span>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentHistory() {
  const {
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
  } = usePayments();

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const hasFiltersActive =
    filters.status !== 'all' ||
    filters.category !== null ||
    filters.method !== null ||
    filters.search !== '' ||
    filters.from !== '' ||
    filters.to !== '';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-primary" />
            Payment History
          </h1>
          <p className="text-slate-500 mt-1">View and manage your transaction history.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={DollarSign}
          label="Total Paid"
          value={formatCurrency(summary?.total_paid)}
          subtext={`${summary?.completed_count || 0} transactions`}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
        />
        <SummaryCard
          icon={Clock}
          label="Pending"
          value={formatCurrency(summary?.total_pending)}
          subtext={`${summary?.pending_count || 0} pending`}
          gradient="bg-gradient-to-br from-amber-500 to-amber-600"
        />
        <SummaryCard
          icon={TrendingUp}
          label="This Month"
          value={formatCurrency(summary?.this_month)}
          subtext="Current billing period"
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <SummaryCard
          icon={CreditCard}
          label="Total Transactions"
          value={totalCount}
          subtext="All time"
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Filters and Table */}
      <Card>
        <CardHeader className="pb-4 border-b bg-slate-50/50">
          <div className="flex flex-col gap-4">
            {/* Search Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by description, reference, or doctor..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 text-sm border rounded-lg transition-colors ${
                  showFilters || hasFiltersActive
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasFiltersActive && (
                  <span className="w-2 h-2 rounded-full bg-white" />
                )}
              </button>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-200">
                <div className="w-40">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => updateFilters({ status: e.target.value })}
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  >
                    <option value="all">All Statuses</option>
                    {Object.entries(PAYMENT_STATUS).map(([key, value]) => (
                      <option key={key} value={value}>{key.charAt(0) + key.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="w-40">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => updateFilters({ category: e.target.value || null })}
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  >
                    <option value="">All Categories</option>
                    {Object.entries(PAYMENT_CATEGORIES).map(([key, value]) => (
                      <option key={key} value={value}>{CATEGORY_LABELS[value]}</option>
                    ))}
                  </select>
                </div>

                <div className="w-40">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Method</label>
                  <select
                    value={filters.method || ''}
                    onChange={(e) => updateFilters({ method: e.target.value || null })}
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  >
                    <option value="">All Methods</option>
                    {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                      <option key={key} value={value}>{key.replace('_', ' ').charAt(0) + key.replace('_', ' ').slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="w-40">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sort</label>
                  <select
                    value={filters.sort}
                    onChange={(e) => updateFilters({ sort: e.target.value })}
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  >
                    <option value={PAYMENT_SORT_OPTIONS.DATE_DESC}>Newest First</option>
                    <option value={PAYMENT_SORT_OPTIONS.DATE_ASC}>Oldest First</option>
                    <option value={PAYMENT_SORT_OPTIONS.AMOUNT_DESC}>Highest Amount</option>
                    <option value={PAYMENT_SORT_OPTIONS.AMOUNT_ASC}>Lowest Amount</option>
                  </select>
                </div>

                <div className="w-40">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">From</label>
                  <input
                    type="date"
                    value={filters.from}
                    onChange={(e) => updateFilters({ from: e.target.value })}
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>

                <div className="w-40">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To</label>
                  <input
                    type="date"
                    value={filters.to}
                    onChange={(e) => updateFilters({ to: e.target.value })}
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>

                {hasFiltersActive && (
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-all">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[160px]">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right w-[80px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-slate-400 font-medium animate-pulse">Loading payments...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 opacity-60">
                        <Receipt className="w-12 h-12 text-slate-200" />
                        <p className="text-slate-500 font-medium">No payments found</p>
                        <p className="text-xs text-slate-400">
                          {hasFiltersActive
                            ? 'Try adjusting your filters or search terms'
                            : 'Your payment history will appear here'}
                        </p>
                        {hasFiltersActive && (
                          <button
                            onClick={clearFilters}
                            className="mt-2 text-sm text-primary hover:text-primary/80 font-medium"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow
                      key={payment.id}
                      className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      <TableCell className="text-xs text-slate-500 font-medium">
                        {formatDate(payment.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col max-w-[250px]">
                          <span className="font-medium text-sm text-slate-800 truncate">
                            {payment.description || 'Payment'}
                          </span>
                          {payment.reference_number && (
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Ref: {payment.reference_number}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          {CATEGORY_LABELS[payment.category] || payment.category || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {payment.payment_method ? (
                          <PaymentMethodDisplay method={payment.payment_method} />
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold text-sm ${
                          payment.status === 'refunded' ? 'text-blue-600' : 'text-slate-900'
                        }`}>
                          {payment.status === 'refunded' ? '-' : ''}{formatCurrency(payment.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPayment(payment);
                          }}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                          aria-label="View payment details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && payments.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-2">
              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-500">
                  Page <span className="font-bold text-slate-900">{currentPage}</span> of{' '}
                  <span className="font-bold text-slate-900">{totalPages}</span>
                  <span className="mx-2 text-slate-200">|</span>
                  Total <span className="font-bold text-slate-900">{totalCount}</span> records
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">Show:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 text-sm border border-slate-200 rounded-lg"
                  >
                    {PAYMENT_PAGINATION.LIMITS.map((limit) => (
                      <option key={limit} value={limit}>{limit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1 || loading}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-4 py-2 text-sm font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <div className="flex gap-1 px-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 text-xs font-bold rounded-xl transition-all ${
                          currentPage === pageNum
                            ? 'bg-primary text-white shadow-md'
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-4 py-2 text-sm font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}

      {/* Loading Overlay */}
      {loading && payments.length > 0 && (
        <div className="fixed bottom-8 right-8 animate-bounce">
          <div className="bg-primary text-white py-2 px-4 shadow-xl rounded-full flex items-center gap-2 text-sm font-medium">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Updating...
          </div>
        </div>
      )}
    </div>
  );
}
