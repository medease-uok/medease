# Medication Dispensing Feature

This document describes the medication dispensing module in MedEase, which handles the fulfillment and distribution of prescribed medications to patients.

## Overview

The medication dispensing module provides a complete workflow for pharmacists and administrators to:
- Manage prescription fulfillment requests
- Track medication dispensing
- Verify medication availability
- Maintain dispensing history
- Generate dispensing reports

## Features

### 1. Dispensing Dashboard
- **Real-time Statistics**: View pending, in-progress, dispensed, and on-hold requests
- **Request Management**: Browse all dispensing requests with filters and search
- **Priority Management**: Prioritize urgent medications
- **Status Tracking**: Track each request through the dispensing workflow

### 2. Request Management
- **Pending Requests**: View all pending prescription fulfillment requests
- **Search & Filter**: Search by patient name, prescription ID, doctor, or medication
- **Priority Filtering**: Filter by urgency level (low, normal, high, urgent)
- **Status Filtering**: Filter by current status (pending, in-progress, dispensed, on-hold)

### 3. Medication Dispensing
- **Batch Tracking**: Record batch numbers for each medication
- **Expiry Management**: Track and manage medication expiry dates
- **Pharmacist Notes**: Add notes for patient dispensing instructions
- **Multi-medication Support**: Handle prescriptions with multiple medications
- **Verification**: Ensure medication availability before dispensing

### 4. Dispensing History
- **Complete Records**: View all past dispensing transactions
- **Detailed Reporting**: See batch numbers, expiry dates, pharmacist names
- **Export Functionality**: Export to CSV for record keeping
- **Date-based Filtering**: View dispensing records by date
- **Pharmacist Filtering**: Filter by responsible pharmacist

## Routes

- `/dispensing` - Main medication dispensing dashboard
- `/dispensing/history` - Dispensing history and records

## Components

### Pages
- `MedicationDispensing.jsx` - Main dispensing request management page
- `DispensingHistory.jsx` - Dispensing history and records page

### Components
- `DispensingRequestDetail.jsx` - Modal for viewing detailed request information

## Services

### dispensingService
Located in `frontend/src/services/dispensing.service.js`

#### Methods

```javascript
// Get all dispensing requests with optional filters
getDispensingRequests(filters = {})

// Get a specific dispensing request
getDispensingRequest(requestId)

// Get pending requests for a medication
getPendingRequestsForMedication(medicationId)

// Record medication dispensing
dispenseMedication(requestId, dispensingData)

// Dispense multiple medications in a request
dispenseMultiple(requestId, medications)

// Put a request on hold
holdRequest(requestId, reason)

// Resume a held request
resumeRequest(requestId)

// Get dispensing history
getDispensingHistory(filters = {})

// Get dispensing statistics
getDispensingStats()

// Export dispensing report
exportDispensingReport(format = 'pdf', filters = {})

// Get patient dispensing history
getPatientDispensingHistory(patientId)

// Verify medication availability
verifyMedicationAvailability(medications)
```

## Hooks

### useDispensingRequests()
Manages dispensing requests state and operations

```javascript
const {
  requests,           // Array of dispensing requests
  loading,            // Loading state
  error,              // Error message if any
  stats,              // Request statistics
  fetchRequests,      // Fetch all requests
  fetchStats,         // Fetch statistics
  dispenseRequest,    // Record dispensing
  holdRequest,        // Put on hold
  resumeRequest,      // Resume request
} = useDispensingRequests();
```

### useDispensingHistory()
Manages dispensing history state

```javascript
const {
  history,            // Array of dispensing history
  loading,            // Loading state
  error,              // Error message if any
  fetchHistory,       // Fetch history with filters
  getPatientHistory,  // Get history for specific patient
} = useDispensingHistory();
```

### useMedicationAvailability()
Manages medication availability verification

```javascript
const {
  availability,       // Availability status by medication
  loading,            // Loading state
  error,              // Error message if any
  verifyAvailability, // Check availability
} = useMedicationAvailability();
```

## Data Models

### DispensingRequest
```javascript
{
  id: number,
  prescriptionId: string,
  patientName: string,
  patientId: string,
  doctorName: string,
  medications: [
    {
      id: number,
      name: string,
      strength: string,
      quantity: number,
      unit: string,
      dosage: string,
      duration: string,
      batchNumber?: string,
      expiryDate?: string,
    }
  ],
  requestDate: ISO8601,
  status: 'pending' | 'in_progress' | 'dispensed' | 'on_hold' | 'cancelled',
  priority: 'low' | 'normal' | 'high' | 'urgent',
  notes: string,
  dispensedBy?: string,
  dispensedDate?: ISO8601,
}
```

### DispensingHistory
```javascript
{
  id: number,
  prescriptionId: string,
  patientName: string,
  medication: string,
  strength: string,
  quantity: number,
  unit: string,
  batchNumber: string,
  expiryDate: string,
  dispensedBy: string,
  dispensedDate: ISO8601,
}
```

## Status Workflow

```
┌─────────────────────────────────────────┐
│         PENDING                         │
│   Request created from prescription    │
└─────────────┬───────────────────────────┘
              │
              ├─► ON_HOLD (if issues found)
              │      │
              │      └─► PENDING (if resolved)
              │
              ▼
┌─────────────────────────────────────────┐
│       IN_PROGRESS                       │
│   Pharmacist picking/preparing          │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│       DISPENSED                         │
│   Medication handed to patient          │
└─────────────────────────────────────────┘
```

## Permissions

### Pharmacist
- View dispensing requests
- Dispense medications
- Put requests on hold
- View dispensing history
- Export reports

### Administrator
- Full access to all dispensing features
- View dispensing statistics
- Manage hold reasons
- Override dispensing decisions
- Access all reports

## Utility Functions

Located in `frontend/src/utils/dispensingUtils.js`

- `formatDispensingStatus()` - Format status for display
- `getStatusColorStyles()` - Get CSS styles for status
- `formatPriority()` - Format priority level
- `calculateDispensingTime()` - Calculate time from request to dispensing
- `isRequestOverdue()` - Check if request is overdue
- `isCloseToExpiry()` - Check if medication close to expiry
- `validateBatchNumber()` - Validate batch number format
- `filterByStatus()` - Filter requests by status
- `filterByPriority()` - Filter requests by priority
- `searchRequests()` - Search requests by query
- `sortRequests()` - Sort requests by various criteria
- `generateDispensingReport()` - Generate report summary

## Constants

Located in `frontend/src/constants/dispensing.js`

- `DISPENSING_STATUS` - Status constants
- `DISPENSING_PRIORITY` - Priority levels
- `MEDICATION_UNITS` - Supported units
- `DOSAGE_FREQUENCIES` - Common frequencies
- `MEDICATION_DURATIONS` - Duration options
- `HOLD_REASONS` - Reasons for holding
- `REPORT_TYPES` - Report types
- `EXPORT_FORMATS` - Export format options

## Usage Examples

### Fetch and display dispensing requests
```javascript
import { useDispensingRequests } from '../hooks/useDispensing';

function MyComponent() {
  const { requests, loading, fetchRequests } = useDispensingRequests();
  
  useEffect(() => {
    fetchRequests({ status: 'pending', priority: 'high' });
  }, []);

  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {requests.map(req => (
        <div key={req.id}>{req.patientName}</div>
      ))}
    </div>
  );
}
```

### Dispense medication
```javascript
import { useDispensingRequests } from '../hooks/useDispensing';

function DispenseForm({ requestId }) {
  const { dispenseRequest } = useDispensingRequests();
  
  const handleSubmit = async (data) => {
    try {
      await dispenseRequest(requestId, {
        batchNumbers: { med1: 'BTH-001', med2: 'BTH-002' },
        expiryDates: { med1: '2026-12-31', med2: '2027-06-30' },
        notes: 'Take with food',
      });
      alert('Medication dispensed successfully');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Testing

### Mock Data
The MedicationDispensing and DispensingHistory pages include mock data for testing:
- 6 sample dispensing requests with various statuses
- 5 sample dispensing history records

To test with real data, integrate with the backend API by uncommenting the service calls and replacing mock data.

## Backend API Integration

The dispensing module expects the following backend endpoints:

```
GET    /api/dispensing/requests
GET    /api/dispensing/requests/:id
POST   /api/dispensing/requests/:id/dispense
POST   /api/dispensing/requests/:id/dispense-multiple
PATCH  /api/dispensing/requests/:id/hold
PATCH  /api/dispensing/requests/:id/resume
GET    /api/dispensing/history
GET    /api/dispensing/statistics
GET    /api/dispensing/report/export
GET    /api/dispensing/patient/:id/history
POST   /api/dispensing/verify-availability
```

## Future Enhancements

- Real-time notification system for new requests
- QR code scanning for batch verification
- Barcode scanning for quick medication selection
- Integration with inventory management
- Pharmacist scheduling and workload balancing
- Analytics and performance dashboards
- Expiry tracking and automated alerts
- Drug interaction checking
- Patient counseling notes
- Medication reconciliation
