import React from 'react';
import { X, Pill, User, Calendar, FileText, AlertCircle } from 'lucide-react';
import { Badge } from '../components/ui/badge';

const STATUS_CONFIG = {
  pending: { badge: 'warning', label: 'Pending' },
  in_progress: { badge: 'default', label: 'In Progress' },
  dispensed: { badge: 'success', label: 'Dispensed' },
  on_hold: { badge: 'destructive', label: 'On Hold' },
};

const PRIORITY_CONFIG = {
  low: 'Secondary',
  normal: 'Secondary',
  high: 'Destructive',
  urgent: 'Destructive',
};

export default function DispensingRequestDetail({ request, onClose }) {
  if (!request) return null;

  const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
  const priorityBadge = PRIORITY_CONFIG[request.priority] || 'Secondary';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{request.patientName}</h2>
            <p className="text-sm text-slate-600 mt-1">{request.prescriptionId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">Status</p>
              <Badge variant={statusConfig.badge}>{statusConfig.label}</Badge>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">Priority</p>
              <Badge variant={priorityBadge}>
                {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Patient and Doctor Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <User className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-slate-600">Patient ID</span>
                </div>
                <p className="text-slate-900 font-medium">{request.patientId}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-slate-600">Prescribed By</span>
                </div>
                <p className="text-slate-900 font-medium">{request.doctorName}</p>
              </div>
            </div>
          </div>

          {/* Medications */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Medications</h3>
            <div className="space-y-3">
              {request.medications.map((med, idx) => (
                <div key={med.id || idx} className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <Pill className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-slate-900">{med.name}</h4>
                        <p className="text-sm text-slate-600">{med.strength}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 mb-1">Quantity</p>
                      <p className="font-medium text-slate-900">{med.quantity} {med.unit}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 mb-1">Dosage</p>
                      <p className="font-medium text-slate-900">{med.dosage}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 mb-1">Duration</p>
                      <p className="font-medium text-slate-900">{med.duration}</p>
                    </div>
                    {med.batchNumber && (
                      <div>
                        <p className="text-slate-600 mb-1">Batch</p>
                        <p className="font-medium text-slate-900">{med.batchNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Request Dates */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-slate-600">Requested</span>
                </div>
                <p className="text-slate-900 font-medium">
                  {new Date(request.requestDate).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {request.dispensedDate && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-slate-600">Dispensed</span>
                  </div>
                  <p className="text-slate-900 font-medium">
                    {new Date(request.dispensedDate).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {request.dispensedBy && (
                    <p className="text-sm text-slate-600 mt-1">By {request.dispensedBy}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Special Instructions */}
          {request.notes && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Special Instructions
              </h3>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-slate-900">{request.notes}</p>
              </div>
            </div>
          )}

          {/* Close button */}
          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
