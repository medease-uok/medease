import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Users, Pill, FileText, Clock, CheckCircle2,
  ArrowRight, ChevronRight, Activity,
  Play, ClipboardList, CalendarClock,
  FlaskConical, Zap,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../data/AuthContext';
import UserProfileCard from '../components/UserProfileCard';
import EditStaffProfileModal from '../components/EditStaffProfileModal';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import PatientQueue from '../components/PatientQueue';
import DoctorScheduleEditor from '../components/DoctorScheduleEditor';
import AppointmentDetailModal from '../components/AppointmentDetailModal';
import DoctorTaskWidget from '../components/DoctorTaskWidget';

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};


function StatusBadge({ status }) {
  const config = {
    scheduled: { variant: 'default', label: 'Scheduled' },
    in_progress: { variant: 'warning', label: 'In Progress' },
    completed: { variant: 'success', label: 'Completed' },
    cancelled: { variant: 'destructive', label: 'Cancelled' },
    no_show: { variant: 'destructive', label: 'No Show' },
    active: { variant: 'success', label: 'Active' },
    dispensed: { variant: 'default', label: 'Dispensed' },
    expired: { variant: 'destructive', label: 'Expired' },
  };
  const c = config[status] || { variant: 'default', label: status };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

function StatCard({ icon: Icon, label, value, color, subtitle }) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DoctorDashboard() {
  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedApptId, setSelectedApptId] = useState(null);
  const [loadingApptIds, setLoadingApptIds] = useState(new Set());
  const [actionError, setActionError] = useState(null);
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(false);

  const scheduleEditorRef = useRef(null);
  const patientQueueRef = useRef(null);

  const loadDashboard = useCallback(() => {
    return api.get('/dashboard/doctor').then((res) => setData(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchDashboard = loadDashboard();

    const fetchProfile = api.get('/profile/me').then((res) => {
      setProfileData(res.data);
      if (res.data.profileImageUrl) {
        updateUser({ profileImageUrl: res.data.profileImageUrl });
      }
    }).catch(console.error);

    Promise.allSettled([fetchDashboard, fetchProfile]).finally(() => setLoading(false));
  }, [loadDashboard]);

  const setApptLoading = useCallback((id, isLoading) => {
    setLoadingApptIds((prev) => {
      const next = new Set(prev);
      isLoading ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  const handleStartAppointment = useCallback(async (aptId) => {
    if (!aptId) return;
    setActionError(null);
    setApptLoading(aptId, true);
    try {
      await api.patch(`/appointments/${aptId}/status`, { status: 'in_progress' });
      loadDashboard();
    } catch (err) {
      setActionError('Failed to start appointment.');
    } finally {
      setApptLoading(aptId, false);
    }
  }, [loadDashboard, setApptLoading]);

  const handleCompleteAppointment = useCallback(async (aptId) => {
    if (!aptId) return;
    setActionError(null);
    setApptLoading(aptId, true);
    try {
      await api.patch(`/appointments/${aptId}/status`, { status: 'completed' });
      loadDashboard();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.data?.message || 'Failed to complete appointment.'
      setActionError(msg);
    } finally {
      setApptLoading(aptId, false);
    }
  }, [loadDashboard, setApptLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Dashboard</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const { doctorId, stats, todayAppointments, upcomingAppointments } = data;

  const now = new Date();
  const currentApt = todayAppointments.find((a) => a.status === 'in_progress');
  const nextApt = todayAppointments.find((a) =>
    a.status === 'scheduled' && new Date(a.scheduledAt) > now
  );
  const readyToStart = todayAppointments.find((a) =>
    a.status === 'scheduled' && new Date(a.scheduledAt) <= now
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">
            Good {now.getHours() < 12 ? 'Morning' : now.getHours() < 17 ? 'Afternoon' : 'Evening'}, Dr. {currentUser?.lastName || 'Doctor'}
          </h1>
          <p className="text-slate-500 mt-1">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Profile Card */}
      {profileData && (
        <UserProfileCard
          profile={profileData}
          onProfileUpdate={(updated) => {
            setProfileData(updated);
            updateUser({ profileImageUrl: updated.profileImageUrl, firstName: updated.firstName, lastName: updated.lastName });
          }}
          onEdit={() => setEditOpen(true)}
        />
      )}

      {editOpen && profileData && (
        <EditStaffProfileModal
          profile={profileData}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            setProfileData(updated);
            updateUser({ firstName: updated.firstName, lastName: updated.lastName, phone: updated.phone });
            setEditOpen(false);
          }}
          onImageUpdate={(updated) => {
            setProfileData(updated);
            updateUser({ profileImageUrl: updated.profileImageUrl });
          }}
        />
      )}

      {/* Current / Next Appointment Banner */}
      {(currentApt || nextApt) && (
        <Card className={`border-l-4 ${currentApt ? 'border-l-green-500 bg-green-50/50' : 'border-l-blue-500 bg-blue-50/50'}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentApt ? 'bg-green-100' : 'bg-blue-100'}`}>
                  {currentApt
                    ? <Activity className="w-5 h-5 text-green-600" />
                    : <Clock className="w-5 h-5 text-blue-600" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {currentApt ? 'Currently Seeing' : 'Next Appointment'}
                  </p>
                  <p className="text-lg font-semibold text-slate-900">
                    {(currentApt || nextApt).patientName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatTime((currentApt || nextApt).scheduledAt)}
                    {(currentApt || nextApt).notes && ` — ${(currentApt || nextApt).notes}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/patients/${(currentApt || nextApt).patientId}`)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                View Patient <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Calendar}
          label="Today's Schedule"
          value={stats.todayAppointments}
          color="from-blue-500 to-blue-600"
          subtitle={`${stats.completedToday} completed`}
        />
        <StatCard
          icon={Users}
          label="My Patients"
          value={stats.totalPatients}
          color="from-green-500 to-green-600"
        />
        <StatCard
          icon={Pill}
          label="Active Prescriptions"
          value={stats.activePrescriptions}
          color="from-orange-500 to-orange-600"
        />
        <StatCard
          icon={FileText}
          label="Medical Records"
          value={stats.totalRecords}
          color="from-purple-500 to-purple-600"
        />
      </div>

      {/* Quick Actions Menu */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </div>
          <button
            onClick={() => setQuickActionsExpanded(!quickActionsExpanded)}
            className="text-sm text-primary hover:underline"
          >
            {quickActionsExpanded ? 'Show less' : 'Show all'}
          </button>
        </CardHeader>
        <CardContent>
          {/* Error feedback */}
          {actionError && (
            <div className="mb-4 flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{actionError}</p>
              <button onClick={() => setActionError(null)} className="text-xs text-red-500 hover:underline">Dismiss</button>
            </div>
          )}

          {/* Contextual actions — shown based on current state */}
          {(currentApt || readyToStart) && (
            <div className="mb-4 flex flex-wrap gap-2">
              {currentApt && (
                <>
                  <button
                    onClick={() => navigate(`/patients/${currentApt.patientId}`)}
                    aria-label={`View patient ${currentApt.patientName}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors text-sm font-medium"
                  >
                    <Activity className="w-4 h-4" />
                    View Current Patient
                  </button>
                  <button
                    onClick={() => handleCompleteAppointment(currentApt.id)}
                    disabled={loadingApptIds.has(currentApt.id)}
                    aria-label={`Complete appointment with ${currentApt.patientName}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {loadingApptIds.has(currentApt.id) ? 'Completing...' : 'Complete Appointment'}
                  </button>
                </>
              )}
              {readyToStart && !currentApt && (
                <button
                  onClick={() => handleStartAppointment(readyToStart.id)}
                  disabled={loadingApptIds.has(readyToStart.id)}
                  aria-label={`Start appointment with ${readyToStart.patientName}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  <Play className="w-4 h-4" />
                  {loadingApptIds.has(readyToStart.id) ? 'Starting...' : `Start: ${readyToStart.patientName} (${formatTime(readyToStart.scheduledAt)})`}
                </button>
              )}
            </div>
          )}

          {/* Navigation shortcuts */}
          <div className={`grid gap-2 ${quickActionsExpanded ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-3 sm:grid-cols-5'}`}>
            {[
              { label: 'Appointments', icon: Calendar, path: '/appointments', color: 'from-blue-500 to-blue-600', desc: 'View & manage' },
              { label: 'Patients', icon: Users, path: '/patients', color: 'from-green-500 to-green-600', desc: 'Browse patients' },
              { label: 'Prescriptions', icon: Pill, path: '/prescriptions', color: 'from-orange-500 to-orange-600', desc: 'Issue & review' },
              { label: 'Medical Records', icon: FileText, path: '/medical-records', color: 'from-purple-500 to-purple-600', desc: 'Create & view' },
              { label: 'Lab Reports', icon: FlaskConical, path: '/lab-reports', color: 'from-rose-500 to-rose-600', desc: 'View results' },
              ...(quickActionsExpanded ? [
                { label: 'My Schedule', icon: CalendarClock, path: null, action: () => scheduleEditorRef.current?.scrollIntoView({ behavior: 'smooth' }), color: 'from-indigo-500 to-indigo-600', desc: 'Edit availability' },
                { label: 'Patient Queue', icon: ClipboardList, path: null, action: () => patientQueueRef.current?.scrollIntoView({ behavior: 'smooth' }), color: 'from-cyan-500 to-cyan-600', desc: 'Today\'s queue' },
              ] : []),
            ].map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => action.path ? navigate(action.path) : action.action?.()}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border-2 border-slate-100 hover:border-transparent hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 block">{action.label}</span>
                    {quickActionsExpanded && (
                      <span className="text-[10px] text-slate-400">{action.desc}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Appointments - 2 columns */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Today's Appointments</CardTitle>
                <p className="text-sm text-slate-500 mt-0.5">{todayAppointments.length} scheduled for today</p>
              </div>
              <button
                onClick={() => navigate('/appointments')}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="w-3 h-3" />
              </button>
            </CardHeader>
            <CardContent>
              {todayAppointments.length > 0 ? (
                <div className="space-y-2">
                  {todayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedApptId(apt.id)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
                          {apt.patientName.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{apt.patientName}</p>
                          <p className="text-xs text-slate-500">{formatTime(apt.scheduledAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {apt.status === 'scheduled' && new Date(apt.scheduledAt) <= now && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStartAppointment(apt.id); }}
                            disabled={loadingApptIds.has(apt.id)}
                            aria-label={`Start appointment with ${apt.patientName}`}
                            className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-md hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                          >
                            {loadingApptIds.has(apt.id) ? 'Starting...' : 'Start'}
                          </button>
                        )}
                        {apt.status === 'in_progress' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCompleteAppointment(apt.id); }}
                            disabled={loadingApptIds.has(apt.id)}
                            aria-label={`Complete appointment with ${apt.patientName}`}
                            className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 transition-colors"
                          >
                            {loadingApptIds.has(apt.id) ? 'Completing...' : 'Mark Complete'}
                          </button>
                        )}
                        {!(apt.status === 'scheduled' && new Date(apt.scheduledAt) <= now) && apt.status !== 'in_progress' && (
                          <StatusBadge status={apt.status} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No appointments today</p>
                  <p className="text-sm mt-1">Enjoy your free time!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments - 1 column */}
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Upcoming</CardTitle>
            <p className="text-sm text-slate-500">{stats.upcomingCount} scheduled</p>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => navigate(`/patients/${apt.patientId}`)}
                    className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm text-slate-900">{apt.patientName}</p>
                      <StatusBadge status={apt.status} />
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatDate(apt.scheduledAt)} at {formatTime(apt.scheduledAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming appointments</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Patient Queue + Schedule Editor + Tasks */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div ref={patientQueueRef}>
          <PatientQueue isDoctor />
        </div>
        {doctorId && (
          <div ref={scheduleEditorRef}>
            <DoctorScheduleEditor doctorId={doctorId} />
          </div>
        )}
        <DoctorTaskWidget />
      </div>

      {/* Appointment Detail Modal */}
      {selectedApptId && (
        <AppointmentDetailModal
          appointmentId={selectedApptId}
          onClose={() => setSelectedApptId(null)}
          onStatusChange={loadDashboard}
        />
      )}
    </div>
  );
}
