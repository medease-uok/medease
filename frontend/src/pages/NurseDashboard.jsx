import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, Stethoscope,
  CheckCircle2, Clock, ChevronRight, ClipboardList
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../data/AuthContext';
import UserProfileCard from '../components/UserProfileCard';
import EditStaffProfileModal from '../components/EditStaffProfileModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import AppointmentStatusBadge from '../components/AppointmentStatusBadge';
import { formatTime } from '../utils/dateFormatters';
import NurseTaskWidget from '../components/NurseTaskWidget';
import { X, Search, Check, AlertCircle } from 'lucide-react';



export default function NurseDashboard() {
  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashData, setDashData] = useState(null);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchAssignedPatients = useCallback(async () => {
    try {
      // /patients already filters by nurse's department via patientAccess.js
      const res = await api.get('/patients');
      setAssignedPatients(res.data || []);
    } catch (err) {
      console.error('Error loading assigned patients:', err);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, profileRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/profile/me')
        ]);

        setDashData(statsRes.data);
        setProfileData(profileRes.data);
        fetchAssignedPatients();

        if (profileRes.data.profileImageUrl) {
          updateUser({ profileImageUrl: profileRes.data.profileImageUrl });
        }
      } catch (err) {
        console.error('Error loading nurse dashboard:', err);
        setError('Failed to load dashboard data. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [updateUser, fetchAssignedPatients]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-red-50 text-red-600 p-6 rounded-lg border border-red-200">
          <p className="font-medium text-lg mb-2">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading nurse dashboard...</p>
        </div>
      </div>
    );
  }

  const { todayAppointments = [] } = dashData || {};

  return (
    <div className="space-y-8 pb-10">
      {/* Header section with greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">
            Nurse Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Welcome back, {currentUser?.firstName}. Here is your patient care overview for today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/appointments')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4 text-primary" />
            View Schedule
          </button>
          <button
            onClick={() => navigate('/patients')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            <Users className="w-4 h-4" />
            Patient Directory
          </button>
        </div>
      </div>

      {/* Main dashboard content columns */}
      <div className="grid gap-8 lg:grid-cols-3">

        {/* Left column: Appointments & Patients */}
        <div className="lg:col-span-2 space-y-8">

          {/* Today's Appointments overview */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Today's Appointments
                </CardTitle>
                <CardDescription>
                  {todayAppointments.length} scheduled for today
                </CardDescription>
              </div>
              <button
                onClick={() => navigate('/appointments')}
                className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
              >
                View Full Calendar <ChevronRight className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent>
              {todayAppointments.length > 0 ? (
                <div className="space-y-3">
                  {todayAppointments.slice(0, 6).map((apt) => (
                    <div
                      key={apt.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 transition-all"
                    >
                      <div className="flex items-center gap-4 mb-3 sm:mb-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-bold text-slate-700 border-2 border-white shadow-sm group-hover:from-blue-50 group-hover:to-blue-100 group-hover:text-blue-700 transition-colors">
                          {(apt.patientName || '?').split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{apt.patientName}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs flex items-center gap-1 text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              <Clock className="w-3 h-3" />
                              {formatTime(apt.scheduledAt)}
                            </span>
                            <span className="text-xs text-slate-500">
                              with {apt.doctorName}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <AppointmentStatusBadge status={apt.status} />
                        <button
                          onClick={() => navigate(`/patients/${apt.patientId}`)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-200"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {todayAppointments.length > 6 && (
                    <button
                      onClick={() => navigate('/appointments')}
                      className="w-full py-3 text-sm font-semibold text-slate-500 hover:text-primary hover:bg-slate-50 rounded-lg border-2 border-dashed border-slate-100 transition-all mt-2"
                    >
                      Show {todayAppointments.length - 6} more appointments
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-bold text-slate-600">No appointments scheduled</p>
                  <p className="text-sm text-slate-500 mt-1">No appointments registered for today yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Patients overview */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-500" />
                  Assigned Patients
                </CardTitle>
                <CardDescription>
                  {assignedPatients.length} patients in your department
                </CardDescription>
              </div>
              <button
                onClick={() => navigate('/patients')}
                className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Patient Directory <ChevronRight className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent>
              {assignedPatients.length > 0 ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {assignedPatients.slice(0, 12).map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                          {patient.firstName?.[0] ?? '?'}{patient.lastName?.[0] ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{patient.firstName} {patient.lastName}</p>
                          <p className="text-xs text-slate-500 truncate">{patient.gender}, {patient.bloodType || 'N/A'}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      </div>
                    ))}
                  </div>
                  {assignedPatients.length > 12 && (
                    <button
                      onClick={() => navigate('/patients')}
                      className="w-full mt-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-primary hover:bg-slate-50 rounded-lg border-2 border-dashed border-slate-100 transition-all"
                    >
                      View all {assignedPatients.length} patients
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-10 bg-slate-50/30 rounded-xl border border-dashed border-slate-200">
                  <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500">No assigned patients found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Tasks & Dept Help */}
        <div className="lg:col-span-1 space-y-8">

          {/* Assigned & Today's Tasks */}
          <NurseTaskWidget />

          {/* Department Help */}
          <Card className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-lg">Department Help</h3>
              </div>
              <p className="text-indigo-100 text-sm mb-4">
                Assigned to <strong>{profileData?.department || 'General'}</strong> Ward. Contact the supervisor for duty schedule changes.
              </p>
              <button
                onClick={() => navigate('/schedule')}
                className="w-full py-2 bg-white text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-all active:scale-[0.98]"
              >
                Open Ward Schedule
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

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
    </div>
  );
}
