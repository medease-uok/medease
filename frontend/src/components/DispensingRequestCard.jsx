import React from 'react';
import PropTypes from 'prop-types';
import { Pill, Check, FileText, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';

// Status and priority configurations
const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-50 border-yellow-200', badge: 'warning', label: 'Pending' },
  in_progress: { color: 'bg-blue-50 border-blue-200', badge: 'default', label: 'In Progress' },
  dispensed: { color: 'bg-green-50 border-green-200', badge: 'success', label: 'Dispensed' },
  on_hold: { color: 'bg-orange-50 border-orange-200', badge: 'destructive', label: 'On Hold' },
};

const PRIORITY_CONFIG = {
  low: { color: 'text-blue-600 bg-blue-50', label: 'Low' },
  normal: { color: 'text-slate-600 bg-slate-50', label: 'Normal' },
  high: { color: 'text-red-600 bg-red-50', label: 'High' },
  urgent: { color: 'text-red-700 bg-red-100', label: 'Urgent' },
};

/**
 * DispensingRequestCard Component
 * Displays a single dispensing request with medication info, status, and actions
 */
function DispensingRequestCard({ request, onDispense, onViewDetails }) {
  const statusConfig = STATUS_CONFIG[request.status];
  const priorityConfig = PRIORITY_CONFIG[request.priority];

  return (
    <div className={`border rounded-lg p-4 transition-all hover:shadow-md ${statusConfig.color}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <Pill className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900">{request.patientName}</h3>
              <span className="text-xs text-slate-500">#{request.prescriptionId}</span>
            </div>
            <p className="text-sm text-slate-600">Dr. {request.doctorName.replace('Dr. ', '')}</p>
            <p className="text-xs text-slate-500 mt-1">
              {request.medications.length} medication{request.medications.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={statusConfig.badge}>{statusConfig.label}</Badge>
          <Badge variant={request.priority === 'high' || request.priority === 'urgent' ? 'destructive' : 'secondary'}>
            {priorityConfig.label}
          </Badge>
        </div>
      </div>

      {/* Medications preview */}
      <div className="mb-3 space-y-1">
        {request.medications.slice(0, 2).map((med, idx) => (
          <div key={med.id} className="text-sm text-slate-600 flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-[10px] text-slate-700">
              {idx + 1}
            </span>
            <span className="font-medium">{med.name}</span>
            <span className="text-slate-500">{med.strength}</span>
            <span className="text-slate-500">x{med.quantity}</span>
          </div>
        ))}
        {request.medications.length > 2 && (
          <p className="text-xs text-slate-500 pl-6">+{request.medications.length - 2} more</p>
        )}
      </div>

      {/* Notes alert */}
      {request.notes && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 flex gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>{request.notes}</p>
        </div>
      )}

      {/* Footer with timing and actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
        <div className="text-xs text-slate-500">
          {new Date(request.requestDate).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
        <div className="flex gap-2">
          {request.status === 'pending' && (
            <button
              onClick={() => onDispense(request)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              Dispense
            </button>
          )}
          {request.status === 'dispensed' && (
            <button
              onClick={() => onViewDetails(request)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              View
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

DispensingRequestCard.propTypes = {
  request: PropTypes.shape({
    id: PropTypes.number.isRequired,
    status: PropTypes.oneOf(['pending', 'in_progress', 'dispensed', 'on_hold']).isRequired,
    priority: PropTypes.oneOf(['low', 'normal', 'high', 'urgent']).isRequired,
    patientName: PropTypes.string.isRequired,
    prescriptionId: PropTypes.string.isRequired,
    doctorName: PropTypes.string.isRequired,
    medications: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      strength: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
    })).isRequired,
    notes: PropTypes.string,
    requestDate: PropTypes.string.isRequired,
  }).isRequired,
  onDispense: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
};

export default DispensingRequestCard;
