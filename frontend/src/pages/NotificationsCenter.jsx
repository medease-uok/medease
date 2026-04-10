import { useState } from 'react';
import { Search, Filter, RefreshCw, Trash2, CheckSquare, Plus } from 'lucide-react';
import NotificationItem from '../components/NotificationItem';
import { useNotifications } from '../hooks/useNotifications';
import { FILTER_OPTIONS, SORT_OPTIONS, PAGINATION } from '../constants/notifications';

function NotificationsCenter() {
  const {
    notifications,
    unreadCount,
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
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDeleteNotification,
    handleDeleteAll,
    refetch,
  } = useNotifications();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const pages = Math.ceil(totalCount / pageSize);
  const hasFiltersActive =
    filters.status !== FILTER_OPTIONS.ALL ||
    filters.type !== null ||
    filters.search !== '';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">
            {totalCount} total notifications • {unreadCount} unread
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col gap-4">
            {/* Search and Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filter Status */}
              <select
                value={filters.status}
                onChange={(e) => updateFilters({ status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={FILTER_OPTIONS.ALL}>All Notifications</option>
                <option value={FILTER_OPTIONS.UNREAD}>Unread</option>
                <option value={FILTER_OPTIONS.READ}>Read</option>
              </select>

              {/* Sort */}
              <select
                value={filters.sort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={SORT_OPTIONS.RECENT}>Recent First</option>
                <option value={SORT_OPTIONS.OLDEST}>Oldest First</option>
              </select>

              {/* Refresh */}
              <button
                onClick={refetch}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {/* Bulk Actions and Clear Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex gap-2 flex-wrap">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center gap-2 text-sm"
                  >
                    <CheckSquare size={16} />
                    Mark All as Read
                  </button>
                )}
                {totalCount > 0 && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Trash2 size={16} />
                    Delete All
                  </button>
                )}
              </div>

              {hasFiltersActive && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
            <p className="text-yellow-800">Delete all notifications?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteAll();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : notifications.length > 0 ? (
            <>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDeleteNotification}
                />
              ))}
            </>
          ) : (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
              <Plus size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No notifications</p>
              {hasFiltersActive && (
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 mt-4"
                >
                  Clear filters and try again
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Show per page:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border border-gray-300 rounded"
              >
                {PAGINATION.LIMITS.map((limit) => (
                  <option key={limit} value={limit}>
                    {limit}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Previous
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                  let pageNum;
                  if (pages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pages - 2) {
                    pageNum = pages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 border rounded ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(pages, p + 1))}
                disabled={currentPage === pages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Page {currentPage} of {pages}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsCenter;
