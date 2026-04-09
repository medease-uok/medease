import React from 'react';
import PropTypes from 'prop-types';
import { Clock, Loader2, Check, AlertCircle } from 'lucide-react';

/**
 * DispensingDashboard Component
 * Displays statistics cards for medication dispensing status overview
 */
function DispensingDashboard({ stats, hasError }) {
  const statConfigs = [
    { label: 'Pending', count: stats?.pending || 0, color: 'bg-yellow-50 border-yellow-200', icon: Clock },
    { label: 'In Progress', count: stats?.inProgress || 0, color: 'bg-blue-50 border-blue-200', icon: Loader2 },
    { label: 'Dispensed', count: stats?.dispensed || 0, color: 'bg-green-50 border-green-200', icon: Check },
    { label: 'On Hold', count: stats?.onHold || 0, color: 'bg-orange-50 border-orange-200', icon: AlertCircle },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statConfigs.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className={`border rounded-lg p-4 ${stat.color}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{stat.count}</p>
              </div>
              <Icon className="w-6 h-6 text-slate-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

DispensingDashboard.propTypes = {
  stats: PropTypes.shape({
    pending: PropTypes.number,
    inProgress: PropTypes.number,
    dispensed: PropTypes.number,
    onHold: PropTypes.number,
  }),
  hasError: PropTypes.bool,
};

DispensingDashboard.defaultProps = {
  stats: {
    pending: 0,
    inProgress: 0,
    dispensed: 0,
    onHold: 0,
  },
  hasError: false,
};

export default DispensingDashboard;
