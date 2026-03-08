import { useState, useCallback, useEffect, useMemo, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope, AlertCircle, Search, Phone, BadgeCheck, X as XIcon,
} from 'lucide-react';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const SKELETON_COUNT = 6;

const matchesSearch = (d, query) => {
  const q = query.toLowerCase();
  const name = `${d.firstName || ''} ${d.lastName || ''}`.toLowerCase();
  return name.includes(q) ||
    d.specialization?.toLowerCase().includes(q) ||
    d.department?.toLowerCase().includes(q);
};

function DoctorCard({ doctor, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative rounded-xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-200 text-left w-full"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-5 h-5 text-green-600" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Dr. {doctor.firstName} {doctor.lastName}</h3>
            {doctor.specialization && (
              <p className="text-sm text-slate-500">{doctor.specialization}</p>
            )}
          </div>
        </div>
        <Badge variant={doctor.available ? 'success' : 'secondary'}>
          {doctor.available ? 'Available' : 'Unavailable'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {doctor.department && (
          <div className="flex items-center gap-2 text-slate-600">
            <BadgeCheck className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{doctor.department}</span>
          </div>
        )}
        {doctor.phone && (
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{doctor.phone}</span>
          </div>
        )}
        {doctor.licenseNumber && (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <span>License: {doctor.licenseNumber}</span>
          </div>
        )}
      </div>
    </button>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 p-5 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-3 bg-slate-100 rounded" />
            <div className="h-3 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Doctors() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const deferredSearch = useDeferredValue(search);

  const fetchDoctors = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/doctors')
      .then((res) => setDoctors(res.data || []))
      .catch(() => setError('Failed to load doctors.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get('/doctors')
      .then((res) => { if (!cancelled) setDoctors(res.data || []); })
      .catch(() => { if (!cancelled) setError('Failed to load doctors.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(
    () => deferredSearch
      ? doctors.filter((d) => matchesSearch(d, deferredSearch))
      : doctors,
    [doctors, deferredSearch],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">
          Doctors
        </h1>
        <p className="text-slate-500 mt-1">
          Browse and find doctors by name, specialization, or department.
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <label htmlFor="doc-search" className="sr-only">Search doctors</label>
            <input
              id="doc-search"
              type="search"
              placeholder="Search by name, specialization, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchDoctors}
            className="ml-auto px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && !error && <ListSkeleton />}

      {/* Results count */}
      {!loading && !error && (
        <output aria-live="polite" className="block text-sm text-slate-500">
          {filtered.length} {filtered.length === 1 ? 'doctor' : 'doctors'}
          {search && ` matching "${search}"`}
        </output>
      )}

      {/* Doctor cards */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <DoctorCard key={d.id} doctor={d} onClick={() => navigate(`/doctors/${d.id}`)} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-slate-700">No doctors found</p>
              <p className="text-sm text-slate-500 mt-1">
                {search
                  ? 'Try adjusting your search.'
                  : 'No doctors registered in the system yet.'}
              </p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="mt-3 px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
