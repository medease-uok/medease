import React, { useState, useMemo } from 'react';
import { Search, Calendar, User, Pill, Download, Filter, X, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const MOCK_DISPENSING_HISTORY = [
  {
    id: 1,
    prescriptionId: 'RX-001',
    patientName: 'Sarah Fernando',
    patientId: 'P-001',
    medication: 'Amoxicillin',
    strength: '500mg',
    quantity: 30,
    unit: 'tablets',
    batchNumber: 'BTH-2024-001',
    expiryDate: '2026-10-15',
    dispensedBy: 'Tharindu Gamage',
    dispensedDate: '2026-04-09T10:45:00Z',
    doctorName: 'Dr. Kamal Perera',
  },
  {
    id: 2,
    prescriptionId: 'RX-002',
    patientName: 'John Silva',
    patientId: 'P-002',
    medication: 'Lisinopril',
    strength: '10mg',
    quantity: 60,
    unit: 'tablets',
    batchNumber: 'BTH-2024-002',
    expiryDate: '2027-06-30',
    dispensedBy: 'Tharindu Gamage',
    dispensedDate: '2026-04-09T11:30:00Z',
    doctorName: 'Dr. Priya Sharma',
  },
  {
    id: 3,
    prescriptionId: 'RX-003',
    patientName: 'Emily Rodriguez',
    patientId: 'P-003',
    medication: 'Insulin Glargine',
    strength: '100 U/mL',
    quantity: 1,
    unit: 'pen',
    batchNumber: 'BTH-2024-050',
    expiryDate: '2026-12-31',
    dispensedBy: 'Tharindu Gamage',
    dispensedDate: '2026-04-09T09:00:00Z',
    doctorName: 'Dr. Kamal Perera',
  },
  {
    id: 4,
    prescriptionId: 'RX-004',
    patientName: 'Michael Chen',
    patientId: 'P-004',
    medication: 'Azithromycin',
    strength: '250mg',
    quantity: 6,
    unit: 'tablets',
    batchNumber: 'BTH-2024-045',
    expiryDate: '2026-08-20',
    dispensedBy: 'Tharindu Gamage',
    dispensedDate: '2026-04-08T14:20:00Z',
    doctorName: 'Dr. Nimal Jayawardena',
  },
  {
    id: 5,
    prescriptionId: 'RX-005',
    patientName: 'Angela Williams',
    patientId: 'P-005',
    medication: 'Salbutamol Inhaler',
    strength: '100mcg',
    quantity: 1,
    unit: 'inhaler',
    batchNumber: 'BTH-2024-025',
    expiryDate: '2026-11-15',
    dispensedBy: 'Tharindu Gamage',
    dispensedDate: '2026-04-08T13:45:00Z',
    doctorName: 'Dr. Priya Sharma',
  },
];

export default function DispensingHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterPharmacist, setFilterPharmacist] = useState('all');

  const pharmacists = useMemo(() => {
    const unique = [...new Set(MOCK_DISPENSING_HISTORY.map(h => h.dispensedBy))];
    return unique;
  }, []);

  const filteredHistory = useMemo(() => {
    let results = MOCK_DISPENSING_HISTORY;

    // Search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      results = results.filter(item =>
        item.patientName.toLowerCase().includes(query) ||
        item.prescriptionId.toLowerCase().includes(query) ||
        item.medication.toLowerCase().includes(query) ||
        item.doctorName.toLowerCase().includes(query)
      );
    }

    // Date filter
    if (filterDate) {
      results = results.filter(item => {
        const itemDate = new Date(item.dispensedDate).toISOString().split('T')[0];
        return itemDate === filterDate;
      });
    }

    // Pharmacist filter
    if (filterPharmacist !== 'all') {
      results = results.filter(item => item.dispensedBy === filterPharmacist);
    }

    // Sort by most recent
    return results.sort((a, b) => new Date(b.dispensedDate) - new Date(a.dispensedDate));
  }, [searchTerm, filterDate, filterPharmacist]);

  const handleExportCSV = () => {
    const headers = ['Prescription ID', 'Patient Name', 'Medication', 'Strength', 'Quantity', 'Batch Number', 'Expiry Date', 'Dispensed By', 'Dispensed Date'];
    const rows = filteredHistory.map(item => [
      item.prescriptionId,
      item.patientName,
      item.medication,
      item.strength,
      `${item.quantity} ${item.unit}`,
      item.batchNumber,
      item.expiryDate,
      item.dispensedBy,
      new Date(item.dispensedDate).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dispensing-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dispensing History</h1>
          <p className="text-slate-600 mt-1">View and manage past medication dispensing records</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by patient, prescription, medication, or doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              />
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date
                </label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Filter className="w-4 h-4 inline mr-2" />
                  Pharmacist
                </label>
                <select
                  value={filterPharmacist}
                  onChange={(e) => setFilterPharmacist(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                >
                  <option value="all">All Pharmacists</option>
                  {pharmacists.map(pharmacist => (
                    <option key={pharmacist} value={pharmacist}>{pharmacist}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear filters */}
            {(searchTerm || filterDate || filterPharmacist !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterDate('');
                  setFilterPharmacist('all');
                }}
                className="px-3 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1 w-full sm:w-auto"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}

            {/* Results count */}
            <div className="text-sm text-slate-600">
              Showing {filteredHistory.length} of {MOCK_DISPENSING_HISTORY.length} dispensings
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Dispensings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Prescription</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Patient</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Medication</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Batch Number</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Dispensed By</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900">{item.prescriptionId}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-900">{item.patientName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Pill className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-slate-900">{item.medication}</p>
                            <p className="text-xs text-slate-500">{item.strength}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{item.batchNumber}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-600">{item.dispensedBy}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-4 h-4" />
                          {new Date(item.dispensedDate).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 px-4 text-center text-slate-500">
                      No dispensing records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
