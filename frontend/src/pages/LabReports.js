import { labReports } from '../data/labReports';
import DataTable from '../components/DataTable';

const columns = [
  { key: 'patientName', label: 'Patient' },
  { key: 'testName', label: 'Test Name' },
  { key: 'technicianName', label: 'Technician' },
  { key: 'reportDate', label: 'Date' },
  { key: 'result', label: 'Result', render: (val) => val?.substring(0, 60) + '...' },
];

export default function LabReports() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Lab Reports</h2>
        <span className="count-badge">{labReports.length}</span>
      </div>
      <DataTable columns={columns} data={labReports} />
    </div>
  );
}
