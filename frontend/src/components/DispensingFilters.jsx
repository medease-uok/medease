import React from 'react';
import PropTypes from 'prop-types';
import { Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

/**
 * DispensingFilters Component
 * Provides search, status filtering, priority filtering, and sort options
 */
function DispensingFilters({
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterPriority,
  onPriorityChange,
  sortBy,
  onSortChange,
  requestsCount,
  filteredCount,
  onClearFilters,
}) {
  const hasActiveFilters = searchTerm || filterStatus !== 'all' || filterPriority !== 'all';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Dispensing Requests</CardTitle>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="recent">Most Recent</option>
            <option value="priority">By Priority</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, prescription ID, doctor, or medication..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="dispensed">Dispensed</option>
              <option value="on_hold">On Hold</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="px-3 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>

          {/* Results count */}
          <div className="text-sm text-slate-600">
            Showing {filteredCount} of {requestsCount || 0} requests
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

DispensingFilters.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  filterStatus: PropTypes.string.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  filterPriority: PropTypes.string.isRequired,
  onPriorityChange: PropTypes.func.isRequired,
  sortBy: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired,
  requestsCount: PropTypes.number.isRequired,
  filteredCount: PropTypes.number.isRequired,
  onClearFilters: PropTypes.func.isRequired,
};

export default DispensingFilters;
