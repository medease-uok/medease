import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, FileText, Pill, FlaskConical, Stethoscope, Heart,
  Droplets, Phone, MapPin, User, Clock, AlertCircle, ChevronRight,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../data/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const calculateAge = (dob) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

function StatusBadge({ status }) {
  const variants = {
    scheduled: 'default',
    completed: 'success',
    cancelled: 'destructive',
    pending: 'warning',
    dispensed: 'success',
    active: 'default',
  };
  return (
    <Badge variant={variants[status] || 'default'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function ProfileCard({ profile }) {
  const age = calculateAge(profile.dateOfBirth);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardContent className="pt-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-cta flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {(profile.firstName?.[0] || '')}{(profile.lastName?.[0] || '')}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">{profile.email}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              {age !== null && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{age} yrs, {profile.gender}</span>
                </div>
              )}
              {profile.bloodType && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Droplets className="w-4 h-4 text-red-400" />
                  <span>{profile.bloodType}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.address && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{profile.address}</span>
                </div>
              )}
            </div>

            {profile.emergencyContact && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-1">Emergency Contact</p>
                <p className="text-sm text-slate-700">
                  {profile.emergencyContact} ({profile.emergencyRelationship}) &middot; {profile.emergencyPhone}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickNavCard({ icon: Icon, label, count, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center p-6 rounded-xl bg-white border-2 border-slate-100 transition-all duration-300 ease-out hover:border-transparent hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <span className="text-2xl font-bold text-slate-900 font-heading">{count}</span>
      <span className="text-sm font-medium text-slate-500 mt-1">{label}</span>
    </button>
  );
}

export default function PatientDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, statsRes, appointmentsRes, prescriptionsRes, labRes] = await Promise.allSettled([
          api.get('/patients/me'),
          api.get('/dashboard/stats'),
          api.get('/appointments'),
          api.get('/prescriptions'),
          api.get('/lab-reports'),
        ]);

        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (appointmentsRes.status === 'fulfilled') setAppointments(appointmentsRes.value.data || []);
        if (prescriptionsRes.status === 'fulfilled') setPrescriptions(prescriptionsRes.value.data || []);
        if (labRes.status === 'fulfilled') setLabReports(labRes.value.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const upcomingAppointments = appointments
    .filter((a) => a.status === 'scheduled')
    .slice(0, 5);

  const activePrescriptions = prescriptions
    .filter((p) => p.status === 'pending' || p.status === 'active')
    .slice(0, 5);

  const recentLabReports = labReports.slice(0, 5);

  const appointmentCount = stats?.stats?.find((s) => s.label === 'My Appointments')?.value ?? appointments.length;
  const prescriptionCount = stats?.stats?.find((s) => s.label === 'My Prescriptions')?.value ?? prescriptions.length;
  const labCount = stats?.stats?.find((s) => s.label === 'My Lab Reports')?.value ?? labReports.length;
  const recordCount = stats?.stats?.find((s) => s.label === 'My Records')?.value ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">
          Welcome, {currentUser?.firstName || 'Patient'}
        </h1>
        <p className="text-slate-500 mt-1">Here's your health summary.</p>
      </div>

      {profile && <ProfileCard profile={profile} />}

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <QuickNavCard
          icon={Calendar}
          label="Appointments"
          count={appointmentCount}
          color="from-blue-500 to-blue-600"
          onClick={() => navigate('/appointments')}
        />
        <QuickNavCard
          icon={Pill}
          label="Prescriptions"
          count={prescriptionCount}
          color="from-orange-500 to-orange-600"
          onClick={() => navigate('/prescriptions')}
        />
        <QuickNavCard
          icon={FlaskConical}
          label="Lab Reports"
          count={labCount}
          color="from-pink-500 to-pink-600"
          onClick={() => navigate('/lab-reports')}
        />
        <QuickNavCard
          icon={FileText}
          label="Records"
          count={recordCount}
          color="from-purple-500 to-purple-600"
          onClick={() => navigate('/medical-records')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Your next scheduled visits</CardDescription>
            </div>
            <button
              onClick={() => navigate('/appointments')}
              className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900">{apt.doctorName}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDate(apt.scheduledAt)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No upcoming appointments</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Prescriptions</CardTitle>
              <CardDescription>Your current medications</CardDescription>
            </div>
            <button
              onClick={() => navigate('/prescriptions')}
              className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            {activePrescriptions.length > 0 ? (
              <div className="space-y-3">
                {activePrescriptions.map((rx) => (
                  <div key={rx.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <Pill className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900">{rx.medication}</p>
                        <p className="text-xs text-slate-500">{rx.dosage} &middot; {rx.frequency}</p>
                      </div>
                    </div>
                    <StatusBadge status={rx.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No active prescriptions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Lab Reports</CardTitle>
            <CardDescription>Your latest test results</CardDescription>
          </div>
          <button
            onClick={() => navigate('/lab-reports')}
            className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
          >
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </CardHeader>
        <CardContent>
          {recentLabReports.length > 0 ? (
            <div className="rounded-md border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Technician</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLabReports.map((lr) => (
                    <TableRow key={lr.id}>
                      <TableCell className="font-medium">{lr.testName}</TableCell>
                      <TableCell>{lr.result || '-'}</TableCell>
                      <TableCell>{formatDate(lr.reportDate)}</TableCell>
                      <TableCell>{lr.technicianName || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No lab reports yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
