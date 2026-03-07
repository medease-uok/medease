import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import api from '../services/api';
import { PatientCard } from '../components/PatientCard';
import { Card, CardContent } from '../components/ui/card';

export default function PatientsEnhanced() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/patients')
      .then((res) => {
        const enhancedPatients = res.data.map(patient => ({
          ...patient,
          name: `${patient.firstName} ${patient.lastName}`,
          id: patient.id,
          status: 'active',
          lastVisit: patient.lastVisit || new Date().toISOString(),
          conditions: patient.conditions || [],
          avatarUrl: null,
        }));
        setPatients(enhancedPatients);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(search.toLowerCase()) ||
    patient.email?.toLowerCase().includes(search.toLowerCase()) ||
    patient.id?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-heading">
            Patients
          </h2>
          <p className="text-slate-500 mt-1">
            {patients.length} registered patients
          </p>
        </div>

        <button
          onClick={() => navigate('/patients/new')}
          className="
            flex items-center gap-2 px-4 py-2
            bg-gradient-to-r from-primary to-cta
            text-white font-semibold rounded-lg
            hover:shadow-lg hover:shadow-primary/30
            transition-all
          "
        >
          <Plus className="w-5 h-5" />
          Add Patient
        </button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full pl-11 pr-4 py-3
                border border-slate-200 rounded-lg
                focus:ring-2 focus:ring-primary focus:border-transparent
                transition-all
              "
            />
          </div>
        </CardContent>
      </Card>

      {filteredPatients.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onClick={() => navigate(`/patients/${patient.id}`)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No patients found
            </h3>
            <p className="text-slate-500 mb-4">
              {search
                ? `No patients match "${search}"`
                : 'No patients registered yet'}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/patients/new')}
                className="
                  px-4 py-2 bg-primary text-white rounded-lg
                  hover:bg-primary/90 transition-colors
                "
              >
                Add Your First Patient
              </button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
