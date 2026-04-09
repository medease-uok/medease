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
import { X, Check, AlertCircle, NotebookPen, Pencil, Trash2, Plus } from 'lucide-react';

// ── Care Notes Modal ────────────────────────────────────────────────────────
function CareNotesModal({ patient, onClose }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/nurses/me/care-notes/${patient.id}`);
      setNotes(res.data || []);
    } catch (err) {
      setError('Failed to load notes.');
    } finally {
      setLoading(false);
    }
  }, [patient.id]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/nurses/me/care-notes/${patient.id}`, { note: newNote });
      setNewNote('');
      await fetchNotes();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add note.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (noteId) => {
    if (!editText.trim()) return;
    setError(null);
    try {
      await api.patch(`/nurses/me/care-notes/${noteId}`, { note: editText });
      setEditingId(null);
      await fetchNotes();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update note.');
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this care note?')) return;
    setError(null);
    try {
      await api.delete(`/nurses/me/care-notes/${noteId}`);
      await fetchNotes();
    } catch (err) {
      setError('Failed to delete note.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <NotebookPen className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Care Notes</h2>
              <p className="text-sm text-slate-500">{patient.firstName} {patient.lastName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <NotebookPen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-500 font-medium">No care notes yet</p>
              <p className="text-xs text-slate-400 mt-1">Add the first observation below</p>
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-400 resize-none"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(note.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-700 leading-relaxed">{note.note}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <p className="text-xs text-slate-400">
                          {note.nurse_name} · {new Date(note.created_at).toLocaleString()}
                          {new Date(note.updated_at).getTime() !== new Date(note.created_at).getTime() && ' (edited)'}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingId(note.id); setEditText(note.note); }}
                          className="p-1.5 rounded-lg hover:bg-emerald-100 text-slate-400 hover:text-emerald-600 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Note */}
        <div className="p-5 border-t border-slate-100 bg-white flex-shrink-0">
          <div className="flex gap-2">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); } }}
              placeholder="Write a care observation... (Enter to submit)"
              rows={2}
              className="flex-1 p-3 text-sm bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-400 resize-none transition-all"
            />
            <button
              onClick={handleAdd}
              disabled={submitting || !newNote.trim()}
              className="flex-shrink-0 w-10 h-10 self-end bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



export default function NurseDashboard() {
  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashData, setDashData] = useState(null);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [careNotesPatient, setCareNotesPatient] = useState(null);

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
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group"
                      >
                        <div
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors cursor-pointer flex-shrink-0"
                        >
                          {patient.firstName?.[0] ?? '?'}{patient.lastName?.[0] ?? '?'}
                        </div>
                        <div
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          className="flex-1 min-w-0 cursor-pointer"
                        >
                          <p className="text-sm font-bold text-slate-900 truncate">{patient.firstName} {patient.lastName}</p>
                          <p className="text-xs text-slate-500 truncate">{patient.gender}, {patient.bloodType || 'N/A'}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setCareNotesPatient(patient); }}
                          title="Care Notes"
                          className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <NotebookPen className="w-4 h-4" />
                        </button>
                        <ChevronRight
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors cursor-pointer flex-shrink-0"
                        />
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

      {careNotesPatient && (
        <CareNotesModal
          patient={careNotesPatient}
          onClose={() => setCareNotesPatient(null)}
        />
      )}
    </div>
  );
}
