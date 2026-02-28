import { labReports } from '../data/labReports';
import { patients } from '../data/patients';
import { useAuth } from '../data/AuthContext';
import DataTable from '../components/DataTable';

export default function LabReports() {
  const { currentUser } = useAuth();

  const patient = currentUser?.role === 'patient'
    ? patients.find((p) => p.userId === currentUser.id)
    : null;

  const data = patient
    ? labReports.filter((r) => r.patientId === patient.id)
    : labReports;

  const columns = [
    ...(patient ? [] : [{ key: 'patientName', label: 'Patient' }]),
    { key: 'testName', label: 'Test Name' },
    { key: 'technicianName', label: 'Technician' },
    { key: 'reportDate', label: 'Date' },
    { key: 'result', label: 'Result', render: (val) => val?.substring(0, 60) + '...' },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">{patient ? 'My Lab Reports' : 'Lab Reports'}</h2>
        <span className="count-badge">{data.length}</span>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
