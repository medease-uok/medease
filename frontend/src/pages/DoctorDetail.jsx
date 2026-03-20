import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, Mail, Phone, Stethoscope,
  BadgeCheck, Building2, CalendarPlus, X, CheckCircle, AlertCircle,
  FileText, User,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../data/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import AppointmentDetailModal from '../components/AppointmentDetailModal';

function formatSlotTime(time) {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function BookingModal({ doctor, onClose, onBooked }) {
  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!date) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      setError(null);
      try {
        const res = await api.get(`/schedules/${doctor.id}/slots?date=${date}`);
        setSlots(res.data?.slots || []);
      } catch {
        setError('Failed to load available slots.');
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [date, doctor.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !selectedSlot) return;

    setSubmitting(true);
    setError(null);

    try {
      const scheduledAt = `${date}T${selectedSlot}:00Z`;
      await api.post('/appointments', {
        doctorId: doctor.id,
        scheduledAt,
        notes: notes.trim() || undefined,
      });
      onBooked();
    } catch (err) {
      setError(err?.response?.data?.message || err?.data?.message || err.message || 'Failed to book appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const availableSlots = slots.filter((s) => s.available);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Book Appointment
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <Stethoscope className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-slate-900">Dr. {doctor.firstName} {doctor.lastName}</p>
              <p className="text-sm text-slate-500">{doctor.specialization} - {doctor.department}</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="appt-date" className="block text-sm font-medium text-slate-700 mb-1">
              Date
            </label>
            <input
              id="appt-date"
              type="date"
              required
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Slot picker */}
          {date && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Available Slots
              </label>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  Doctor is not available on this day.
                </p>
              ) : availableSlots.length === 0 ? (
                <p className="text-sm text-amber-600 text-center py-4">
                  No slots available for this day. All slots are booked.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`px-2 py-2 text-xs font-medium rounded-lg border transition-colors ${
                        selectedSlot === slot.time
                          ? 'bg-primary text-white border-primary'
                          : slot.available
                            ? 'bg-white text-slate-700 border-slate-200 hover:border-primary hover:text-primary'
                            : 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed line-through'
                      }`}
                    >
                      {formatSlotTime(slot.time)}
                    </button>
                  ))}
                </div>
              )}
              {availableSlots.length > 0 && (
                <p className="text-xs text-slate-400 mt-2">
                  {availableSlots.length} of {slots.length} slots available
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="appt-notes" className="block text-sm font-medium text-slate-700 mb-1">
              Notes <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              id="appt-notes"
              rows={3}
              maxLength={500}
              placeholder="Reason for visit, symptoms, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !date || !selectedSlot}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Booking...' : selectedSlot ? `Book ${formatSlotTime(selectedSlot)}` : 'Select a slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DoctorDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'patient';
  const isPatient = role === 'patient';

  const [doctor, setDoctor] = useState(null);
  const [appts, setAppts] = useState([]);
  const [rxs, setRxs] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedApptId, setSelectedApptId] = useState(null);

  const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const fetchDoctor = async () => {
    setLoading(true);
    try {
      const docRes = await api.get(`/doctors/${id}`);
      setDoctor(docRes.data?.doctor || null);
      setAppts(docRes.data?.appointments || []);
      setRxs(docRes.data?.prescriptions || []);

      // Fetch schedule separately — don't let it block the page
      try {
        const schedRes = await api.get(`/schedules/${id}`);
        setSchedule(schedRes.data?.schedule || []);
      } catch {
        setSchedule([]);
      }
    } catch (err) {
      console.error('Failed to load doctor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctor(); }, [id]);

  const handleBooked = () => {
    setShowBooking(false);
    setBookingSuccess(true);
    fetchDoctor();
    setTimeout(() => setBookingSuccess(false), 4000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-32 animate-pulse" />
        <div className="rounded-xl border border-slate-200 p-6 animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-200" />
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-100 rounded w-1/4" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-16">
        <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-lg font-medium text-slate-700">Doctor not found</p>
        <Link to="/doctors" className="text-primary hover:underline text-sm mt-2 inline-block">
          Back to Doctors
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/doctors"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Doctors
      </Link>

      {/* Success banner */}
      {bookingSuccess && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-sm text-green-700 font-medium">Appointment booked successfully!</p>
        </div>
      )}

      {/* Doctor profile card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Dr. {doctor.firstName} {doctor.lastName}
                </h1>
                {doctor.specialization && (
                  <p className="text-slate-500 mt-0.5">{doctor.specialization}</p>
                )}
                <Badge variant={doctor.available ? 'success' : 'secondary'} className="mt-2">
                  {doctor.available ? 'Available' : 'Unavailable'}
                </Badge>
              </div>
            </div>

            {isPatient && doctor.available && (
              <button
                onClick={() => setShowBooking(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
              >
                <CalendarPlus className="w-4 h-4" />
                Book Appointment
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
            {doctor.department && (
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-slate-400 text-xs">Department</p>
                  <p className="text-slate-700">{doctor.department}</p>
                </div>
              </div>
            )}
            {doctor.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-slate-400 text-xs">Email</p>
                  <p className="text-slate-700">{doctor.email}</p>
                </div>
              </div>
            )}
            {doctor.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-slate-400 text-xs">Phone</p>
                  <p className="text-slate-700">{doctor.phone}</p>
                </div>
              </div>
            )}
            {doctor.licenseNumber && (
              <div className="flex items-center gap-3 text-sm">
                <BadgeCheck className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-slate-400 text-xs">License Number</p>
                  <p className="text-slate-700">{doctor.licenseNumber}</p>
                </div>
              </div>
            )}
          </div>

          {/* Weekly schedule summary */}
          {schedule.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Weekly Schedule
              </p>
              <div className="flex flex-wrap gap-2">
                {DAYS_SHORT.map((day, idx) => {
                  const entry = schedule.find((s) => s.dayOfWeek === idx);
                  const active = entry && entry.isActive;
                  return (
                    <div
                      key={idx}
                      className={`px-3 py-2 rounded-lg text-xs text-center ${
                        active
                          ? 'bg-green-50 border border-green-200 text-green-700'
                          : 'bg-slate-50 border border-slate-100 text-slate-400'
                      }`}
                    >
                      <p className="font-semibold">{day}</p>
                      {active && (
                        <p className="mt-0.5">{entry.startTime} - {entry.endTime}</p>
                      )}
                      {!active && <p className="mt-0.5">Closed</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointments */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">
              {isPatient ? 'My Appointments' : 'Appointments'} ({appts.length})
            </h2>
          </div>
          {appts.length > 0 ? (
            <DataTable
              columns={[
                ...(!isPatient ? [{ key: 'patientName', label: 'Patient' }] : []),
                {
                  key: 'scheduledAt',
                  label: 'Date & Time',
                  render: (val) => new Date(val).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: '2-digit',
                  }),
                },
                { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
                { key: 'notes', label: 'Notes', render: (val) => val ? val.substring(0, 50) + (val.length > 50 ? '...' : '') : '-' },
              ]}
              data={appts}
              onRowClick={(row) => setSelectedApptId(row.id)}
            />
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">
              {isPatient ? 'No appointments with this doctor yet.' : 'No appointments found.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Prescriptions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">
              {isPatient ? 'My Prescriptions' : 'Prescriptions'} ({rxs.length})
            </h2>
          </div>
          {rxs.length > 0 ? (
            <DataTable
              columns={[
                ...(!isPatient ? [{ key: 'patientName', label: 'Patient' }] : []),
                ...(role === 'doctor' ? [{ key: 'doctorName', label: 'Prescribed By' }] : []),
                { key: 'medication', label: 'Medication' },
                { key: 'dosage', label: 'Dosage' },
                { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
              ]}
              data={rxs}
            />
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">
              {isPatient ? 'No prescriptions from this doctor yet.' : 'No prescriptions found.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Booking modal */}
      {showBooking && (
        <BookingModal
          doctor={doctor}
          onClose={() => setShowBooking(false)}
          onBooked={handleBooked}
        />
      )}

      {/* Appointment detail modal */}
      {selectedApptId && (
        <AppointmentDetailModal
          appointmentId={selectedApptId}
          onClose={() => setSelectedApptId(null)}
          onStatusChange={fetchDoctor}
        />
      )}
    </div>
  );
}
