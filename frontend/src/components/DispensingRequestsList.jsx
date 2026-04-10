import React from 'react';
import PropTypes from 'prop-types';
import { Pill } from 'lucide-react';
import DispensingRequestCard from './DispensingRequestCard';

/**
 * DispensingRequestsList Component
 * Renders the list of dispensing requests in a grid layout
 */
function DispensingRequestsList({ requests, onDispense, onViewDetails }) {
  if (requests.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-900">No dispensing requests</h3>
        <p className="text-slate-500 mt-1">No requests match your current filters</p>
      </div>
    );
  }

  return (
    <>
      {requests.map(request => (
        <DispensingRequestCard
          key={request.id}
          request={request}
          onDispense={onDispense}
          onViewDetails={onViewDetails}
        />
      ))}
    </>
  );
}

DispensingRequestsList.propTypes = {
  requests: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    status: PropTypes.oneOf(['pending', 'in_progress', 'dispensed', 'on_hold']).isRequired,
    priority: PropTypes.oneOf(['low', 'normal', 'high', 'urgent']).isRequired,
    patientName: PropTypes.string.isRequired,
    prescriptionId: PropTypes.string.isRequired,
    doctorName: PropTypes.string.isRequired,
    medications: PropTypes.array.isRequired,
    notes: PropTypes.string,
    requestDate: PropTypes.string.isRequired,
  })).isRequired,
  onDispense: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
};

export default DispensingRequestsList;
