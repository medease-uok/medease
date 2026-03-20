import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Users, Star, MessageSquare, Clock, Heart, Stethoscope,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../data/AuthContext';
import { PatientCard } from '../components/PatientCard';
import { Card, CardContent } from '../components/ui/card';

/* ─── Feedback sub-components ─── */

function StarRating({ rating, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sizeClass} ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
        />
      ))}
    </div>
  );
}

function RatingBar({ label, value, total }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600 w-12">{label}</span>
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm text-slate-500 w-8 text-right">{value}</span>
    </div>
  );
}

function FeedbackStatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

const formatFeedbackDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function FeedbackCard({ feedback }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-slate-900">{feedback.patientName}</p>
          <p className="text-xs text-slate-400">{formatFeedbackDate(feedback.createdAt)}</p>
        </div>
        <StarRating rating={feedback.rating} size="sm" />
      </div>
      {feedback.comment && (
        <p className="text-sm text-slate-600 mb-3">{feedback.comment}</p>
      )}
      <div className="flex items-center gap-4 text-xs text-slate-400">
        {feedback.communicationRating && (
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> Communication: {feedback.communicationRating}/5
          </span>
        )}
        {feedback.waitTimeRating && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> Wait time: {feedback.waitTimeRating}/5
          </span>
        )}
        {feedback.treatmentRating && (
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" /> Treatment: {feedback.treatmentRating}/5
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Feedback Tab Content ─── */

function FeedbackTab({ currentUser }) {
  const [doctorStats, setDoctorStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.doctorId) {
      setLoading(false);
      return;
    }
    api.get(`/patient-feedback/doctor/${currentUser.doctorId}`)
      .then((r) => setDoctorStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!doctorStats || doctorStats.totalReviews === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No patient feedback yet</p>
        <p className="text-sm text-slate-400 mt-1">Feedback will appear here after patients rate their appointments</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <FeedbackStatCard icon={Users} label="Total Reviews" value={doctorStats.totalReviews} color="bg-blue-50 text-blue-600" />
        <FeedbackStatCard icon={Star} label="Average Rating" value={doctorStats.avgRating || '—'} color="bg-amber-50 text-amber-600" />
        <FeedbackStatCard icon={MessageSquare} label="Communication" value={doctorStats.avgCommunication || '—'} color="bg-green-50 text-green-600" />
        <FeedbackStatCard icon={Clock} label="Wait Time" value={doctorStats.avgWaitTime || '—'} color="bg-purple-50 text-purple-600" />
        <FeedbackStatCard icon={Heart} label="Treatment" value={doctorStats.avgTreatment || '—'} color="bg-rose-50 text-rose-600" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Rating Distribution</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((s) => (
            <RatingBar key={s} label={`${s} star`} value={doctorStats.distribution[s]} total={doctorStats.totalReviews} />
          ))}
        </div>
      </div>

      {doctorStats.recentFeedback?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Feedback</h3>
          <div className="space-y-3">
            {doctorStats.recentFeedback.map((f) => (
              <FeedbackCard key={f.id} feedback={f} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */

export default function PatientsEnhanced() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isDoctor = currentUser?.role === 'doctor';
  const [tab, setTab] = useState('patients');
  const [patients, setPatients] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef(null);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  }, []);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setSearching(true);
    const endpoint = isDoctor ? '/doctors/me/patients' : '/patients';
    const params = debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {};
    api.get(endpoint, { params, signal: controller.signal })
      .then((res) => {
        const enhancedPatients = res.data.map(patient => ({
          ...patient,
          name: `${patient.firstName} ${patient.lastName}`,
          id: patient.id,
          status: 'active',
          lastVisit: patient.lastVisit || null,
          lastVisitStatus: patient.lastVisitStatus || null,
          nextAppointment: patient.nextAppointment || null,
          totalAppointments: patient.totalAppointments || 0,
          totalRecords: patient.totalRecords || 0,
          conditions: patient.conditions || [],
          avatarUrl: patient.profileImageUrl || null,
        }));
        setPatients(enhancedPatients);
      })
      .catch((err) => {
        if (err.name !== 'CanceledError') console.error(err);
      })
      .finally(() => { setSearching(false); setInitialLoad(false); });
    return () => controller.abort();
  }, [isDoctor, debouncedSearch]);

  if (initialLoad) {
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
            {isDoctor ? 'My Patients' : 'Patients'}
          </h2>
          <p className="text-slate-500 mt-1">
            {patients.length} {isDoctor ? 'assigned' : 'registered'} patients
          </p>
        </div>

        {tab === 'patients' && (
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
        )}
      </div>

      {/* Tabs (only show if doctor) */}
      {isDoctor && (
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setTab('patients')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'patients'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Patients
            </span>
          </button>
          <button
            onClick={() => setTab('feedback')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'feedback'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Patient Feedback
            </span>
          </button>
        </div>
      )}

      {/* Tab Content */}
      {tab === 'patients' ? (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or patient ID..."
                  value={search}
                  maxLength={100}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="
                    w-full pl-11 pr-4 py-3
                    border border-slate-200 rounded-lg
                    focus:ring-2 focus:ring-primary focus:border-transparent
                    transition-all
                  "
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {patients.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {patients.map((patient) => (
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
        </>
      ) : (
        <FeedbackTab currentUser={currentUser} />
      )}
    </div>
  );
}
