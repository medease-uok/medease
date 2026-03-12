import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Users, Pill, FileText, Clock, CheckCircle2,
  ArrowRight, ChevronRight, Activity, Stethoscope, TrendingUp,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../data/AuthContext';
import UserProfileCard from '../components/UserProfileCard';
import EditStaffProfileModal from '../components/EditStaffProfileModal';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatRelative = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(iso);
};

function StatusBadge({ status }) {
  const config = {
    scheduled: { variant: 'default', label: 'Scheduled' },
    confirmed: { variant: 'default', label: 'Confirmed' },
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

  useEffect(() => {
    const fetchDashboard = api.get('/dashboard/doctor').then((res) => {
      setData(res.data);
    }).catch(console.error);

    const fetchProfile = api.get('/profile/me').then((res) => {
      setProfileData(res.data);
      if (res.data.profileImageUrl) {
        updateUser({ profileImageUrl: res.data.profileImageUrl });
      }
    }).catch(console.error);

    Promise.allSettled([fetchDashboard, fetchProfile]).finally(() => setLoading(false));
  }, []);

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

  const { stats, todayAppointments, upcomingAppointments, recentPatients, recentPrescriptions } = data;

  const now = new Date();
  const currentApt = todayAppointments.find((a) => a.status === 'in_progress');
  const nextApt = todayAppointments.find((a) =>
    ['scheduled', 'confirmed'].includes(a.status) && new Date(a.scheduledAt) > now
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

      {/* Quick Actions */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Appointments', icon: Calendar, path: '/appointments', color: 'from-blue-500 to-blue-600' },
          { label: 'Patients', icon: Users, path: '/patients', color: 'from-green-500 to-green-600' },
          { label: 'Records', icon: FileText, path: '/medical-records', color: 'from-purple-500 to-purple-600' },
          { label: 'Prescriptions', icon: Pill, path: '/prescriptions', color: 'from-orange-500 to-orange-600' },
          { label: 'Lab Reports', icon: Stethoscope, path: '/lab-reports', color: 'from-rose-500 to-rose-600' },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border-2 border-slate-100 hover:border-transparent hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">{action.label}</span>
            </button>
          );
        })}
      </div>

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
                      onClick={() => navigate(`/patients/${apt.patientId}`)}
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
                      <StatusBadge status={apt.status} />
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

      {/* Bottom Grid: Recent Patients + Recent Prescriptions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Recent Patients</CardTitle>
            <button
              onClick={() => navigate('/patients')}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </CardHeader>
          <CardContent>
            {recentPatients.length > 0 ? (
              <div className="space-y-2">
                {recentPatients.map((patient) => (
                  <div
                    key={patient.patientId}
                    onClick={() => navigate(`/patients/${patient.patientId}`)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-xs font-semibold text-green-700">
                        {patient.patientName.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900">{patient.patientName}</p>
                        <p className="text-xs text-slate-500">Last visit: {formatRelative(patient.lastVisit)}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent patients</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Prescriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Recent Prescriptions</CardTitle>
            <button
              onClick={() => navigate('/prescriptions')}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </CardHeader>
          <CardContent>
            {recentPrescriptions.length > 0 ? (
              <div className="space-y-2">
                {recentPrescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                        <Pill className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900">{rx.medication}</p>
                        <p className="text-xs text-slate-500">{rx.patientName} &middot; {rx.dosage}, {rx.frequency}</p>
                      </div>
                    </div>
                    <StatusBadge status={rx.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Pill className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent prescriptions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
