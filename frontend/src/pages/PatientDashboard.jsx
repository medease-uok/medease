import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, FileText, Pill, FlaskConical, Stethoscope,
  Droplets, Phone, MapPin, User, Clock, AlertCircle, ChevronRight, Pencil, Loader2, Trash2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../data/AuthContext';
import EditProfileModal from '../components/EditProfileModal';
import ImageCropModal from '../components/ImageCropModal';
import ProfileImageLightbox from '../components/ProfileImageLightbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

const MAX_PREVIEW_ITEMS = 5;

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

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function ProfileCard({ profile, onEdit, onImageUpdate }) {
  const age = calculateAge(profile.dateOfBirth);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Image must be under 5 MB.');
      return;
    }

    setImageError('');
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async (croppedFile) => {
    setUploading(true);
    setCropSrc(null);
    try {
      const formData = new FormData();
      formData.append('profileImage', croppedFile);
      const res = await api.upload(`/patients/${profile.id}/profile-image`, formData);
      onImageUpdate(res.data);
    } catch (err) {
      setImageError(err.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async () => {
    setImageError('');
    setUploading(true);
    try {
      const res = await api.delete(`/patients/${profile.id}/profile-image`);
      onImageUpdate(res.data);
    } catch (err) {
      setImageError(err.message || 'Failed to remove image.');
    } finally {
      setUploading(false);
    }
  };

  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardContent className="pt-6">
          <div className="flex items-start gap-5">
            <div className="relative group flex-shrink-0">
              {profile.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt={fullName}
                  onClick={() => setLightboxOpen(true)}
                  className="w-16 h-16 rounded-2xl object-cover cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-cta flex items-center justify-center text-white text-xl font-bold">
                  {(profile.firstName?.[0] || '')}{(profile.lastName?.[0] || '')}
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors border-2 border-white"
                aria-label="Change profile photo"
              >
                <Pencil className="w-3 h-3" />
              </button>
              {profile.profileImageUrl && !uploading && (
                <button
                  type="button"
                  onClick={handleImageDelete}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 border-2 border-white"
                  aria-label="Remove profile image"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-heading">
                    {fullName}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">{profile.email}</p>
                </div>
                <button
                  onClick={onEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

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
                <div className="mt-5 p-4 bg-red-50/70 border border-red-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Emergency Contact</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Name</p>
                      <p className="text-sm font-medium text-slate-800">{profile.emergencyContact}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Relationship</p>
                      <p className="text-sm font-medium text-slate-800">{profile.emergencyRelationship}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Phone</p>
                      <p className="text-sm font-medium text-slate-800">{profile.emergencyPhone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {imageError && (
            <p className="mt-3 text-sm text-red-600">{imageError}</p>
          )}
        </CardContent>
      </Card>

      {lightboxOpen && profile.profileImageUrl && (
        <ProfileImageLightbox
          src={profile.profileImageUrl}
          alt={fullName}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </>
  );
}

function QuickNavCard({ icon: Icon, label, count, color, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={`View ${count} ${label}`}
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
  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      const [profileRes, statsRes, appointmentsRes, prescriptionsRes, labRes] = await Promise.allSettled([
        api.get('/patients/me'),
        api.get('/dashboard/stats'),
        api.get('/appointments'),
        api.get('/prescriptions'),
        api.get('/lab-reports'),
      ]);

      if (!mounted) return;

      const failures = [profileRes, statsRes, appointmentsRes, prescriptionsRes, labRes]
        .filter((r) => r.status === 'rejected');

      if (failures.length === 5) {
        setError('Unable to load your dashboard. Please try again later.');
        setLoading(false);
        return;
      }

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value.data);
        if (profileRes.value.data.profileImageUrl) {
          updateUser({ profileImageUrl: profileRes.value.data.profileImageUrl });
        }
      }
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (appointmentsRes.status === 'fulfilled') setAppointments(appointmentsRes.value.data || []);
      if (prescriptionsRes.status === 'fulfilled') setPrescriptions(prescriptionsRes.value.data || []);
      if (labRes.status === 'fulfilled') setLabReports(labRes.value.data || []);

      if (failures.length > 0) {
        setError('Some sections could not be loaded. Showing available data.');
      }

      setLoading(false);
    };

    fetchAll();

    return () => { mounted = false; };
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

  if (error && !profile && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-slate-700 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const upcomingAppointments = appointments
    .filter((a) => a.status === 'scheduled')
    .slice(0, MAX_PREVIEW_ITEMS);

  const activePrescriptions = prescriptions
    .filter((p) => p.status === 'pending' || p.status === 'active')
    .slice(0, MAX_PREVIEW_ITEMS);

  const recentLabReports = labReports.slice(0, MAX_PREVIEW_ITEMS);

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

      {error && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">{error}</p>
        </div>
      )}

      {profile && (
        <ProfileCard
          profile={profile}
          onEdit={() => setEditOpen(true)}
          onImageUpdate={(updated) => {
            setProfile(updated);
            updateUser({ profileImageUrl: updated.profileImageUrl });
          }}
        />
      )}

      {editOpen && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            setProfile(updated);
            updateUser({ firstName: updated.firstName, lastName: updated.lastName, phone: updated.phone });
            setEditOpen(false);
          }}
          onImageUpdate={(updated) => {
            setProfile(updated);
            updateUser({ profileImageUrl: updated.profileImageUrl });
          }}
        />
      )}

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
