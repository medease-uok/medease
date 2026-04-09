import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { X, AlertCircle, Check, Loader2 } from 'lucide-react';

/**
 * DispenseModal Component
 * Modal for dispensing medications with batch number and expiry date validation
 */
function DispenseModal({ request, onClose, onDispense, isSubmitting }) {
  const [loading, setLoading] = useState(false);
  const [batchNumbers, setBatchNumbers] = useState(
    request.medications.reduce((acc, med) => ({ ...acc, [med.id]: '' }), {})
  );
  const [expiryDates, setExpiryDates] = useState(
    request.medications.reduce((acc, med) => ({ ...acc, [med.id]: '' }), {})
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  const handleDispense = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate batch numbers and expiry dates
    const missingBatch = request.medications.some(med => !batchNumbers[med.id]);
    const missingExpiry = request.medications.some(med => !expiryDates[med.id]);

    if (missingBatch || missingExpiry) {
      setError('Please fill in all batch numbers and expiry dates');
      return;
    }

    // Validate batch number format
    for (const [medId, batch] of Object.entries(batchNumbers)) {
      if (!/^[A-Z0-9\-]{3,20}$/.test(batch)) {
        setError('Batch numbers must be 3-20 alphanumeric characters (and hyphens)');
        return;
      }
    }

    // Validate expiry dates are in future
    for (const [medId, expiry] of Object.entries(expiryDates)) {
      if (new Date(expiry) <= new Date()) {
        setError('Expiry dates must be in the future');
        return;
      }
    }

    onDispense({
      requestId: request.id,
      batchNumbers,
      expiryDates,
      notes,
    });
  };

  const activeLoading = loading || isSubmitting;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Dispense Medication</h2>
            <p className="text-sm text-slate-500 mt-1">{request.patientName} • {request.prescriptionId}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors" disabled={activeLoading}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleDispense} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Medications section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Medications to Dispense</h3>
            {request.medications.map((med) => (
              <div key={med.id} className="border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">{med.name}</h4>
                    <p className="text-sm text-slate-500 mt-1">
                      Strength: {med.strength} • Qty: {med.quantity} {med.unit}
                    </p>
                    <p className="text-sm text-slate-500">
                      Dosage: {med.dosage}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Batch Number *
                    </label>
                    <input
                      type="text"
                      value={batchNumbers[med.id]}
                      onChange={(e) => setBatchNumbers(prev => ({ ...prev, [med.id]: e.target.value }))}
                      placeholder="e.g., BTH-2024-001"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                      disabled={activeLoading}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      value={expiryDates[med.id]}
                      onChange={(e) => setExpiryDates(prev => ({ ...prev, [med.id]: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                      disabled={activeLoading}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pharmacist notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Pharmacist Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes for the patient or dispensing information..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none"
              disabled={activeLoading}
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{notes.length}/500</p>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
              disabled={activeLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              disabled={activeLoading}
            >
              {activeLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <Check className="w-4 h-4" />
              Confirm Dispensing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

DispenseModal.propTypes = {
  request: PropTypes.shape({
    id: PropTypes.number.isRequired,
    prescriptionId: PropTypes.string.isRequired,
    patientName: PropTypes.string.isRequired,
    medications: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      strength: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
      unit: PropTypes.string.isRequired,
      dosage: PropTypes.string.isRequired,
    })).isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onDispense: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
};

DispenseModal.defaultProps = {
  isSubmitting: false,
};

export default DispenseModal;
