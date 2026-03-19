import { useState, useEffect } from 'react';
import { Star, TrendingUp, Users, MessageSquare, Clock, Heart, Stethoscope } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../data/AuthContext';

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

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

function StatCard({ icon: Icon, label, value, color }) {
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

function FeedbackCard({ feedback }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-slate-900">{feedback.patientName}</p>
          <p className="text-xs text-slate-400">{formatDate(feedback.createdAt)}</p>
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

function DoctorCard({ doctor }) {
  if (!doctor.totalReviews) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="font-medium text-slate-900">{doctor.doctorName}</p>
        <p className="text-xs text-slate-400">{doctor.department} — {doctor.specialization}</p>
        <p className="text-sm text-slate-400 mt-3">No reviews yet</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-medium text-slate-900">{doctor.doctorName}</p>
          <p className="text-xs text-slate-400">{doctor.department} — {doctor.specialization}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-amber-500">{doctor.avgRating}</p>
          <StarRating rating={Math.round(doctor.avgRating)} size="sm" />
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-3">{doctor.totalReviews} review{doctor.totalReviews !== 1 ? 's' : ''}</p>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-slate-50 rounded-lg p-2">
          <p className="text-sm font-semibold text-slate-700">{doctor.avgCommunication || '—'}</p>
          <p className="text-xs text-slate-400">Communication</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <p className="text-sm font-semibold text-slate-700">{doctor.avgWaitTime || '—'}</p>
          <p className="text-xs text-slate-400">Wait Time</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <p className="text-sm font-semibold text-slate-700">{doctor.avgTreatment || '—'}</p>
          <p className="text-xs text-slate-400">Treatment</p>
        </div>
      </div>
    </div>
  );
}

export default function PatientSatisfaction() {
  const { currentUser } = useAuth();
  const isDoctor = currentUser?.role === 'doctor';
  const isAdmin = currentUser?.role === 'admin';

  const [overview, setOverview] = useState(null);
  const [doctorStats, setDoctorStats] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const promises = [];

    if (isAdmin) {
      promises.push(
        api.get('/patient-feedback/overview').then((r) => setOverview(r.data)),
        api.get('/patient-feedback').then((r) => setFeedback(r.data || []))
      );
    } else if (isDoctor) {
      promises.push(
        api.get(`/patient-feedback/doctor/${currentUser.doctorId}`).then((r) => setDoctorStats(r.data)),
        api.get('/patient-feedback').then((r) => setFeedback(r.data || []))
      );
    }

    Promise.all(promises)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAdmin, isDoctor, currentUser]);

  if (loading) return <div className="p-8 text-slate-500">Loading satisfaction data...</div>;

  // Admin view: overview + per-doctor breakdown
  if (isAdmin && overview) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Satisfaction</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of patient feedback across all doctors</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Reviews" value={overview.overall.totalReviews} color="bg-blue-50 text-blue-600" />
          <StatCard icon={Star} label="Average Rating" value={overview.overall.avgRating || '—'} color="bg-amber-50 text-amber-600" />
          <StatCard icon={MessageSquare} label="Avg Communication" value={overview.overall.avgCommunication || '—'} color="bg-green-50 text-green-600" />
          <StatCard icon={Clock} label="Avg Wait Time" value={overview.overall.avgWaitTime || '—'} color="bg-purple-50 text-purple-600" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Doctor Ratings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overview.doctors.map((doc) => (
              <DoctorCard key={doc.doctorId} doctor={doc} />
            ))}
          </div>
        </div>

        {feedback.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Feedback</h2>
            <div className="space-y-3">
              {feedback.slice(0, 20).map((f) => (
                <FeedbackCard key={f.id} feedback={f} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Doctor view: own stats
  if (isDoctor && doctorStats) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Patient Feedback</h1>
          <p className="text-sm text-slate-500 mt-1">Patient satisfaction ratings for your consultations</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard icon={Users} label="Total Reviews" value={doctorStats.totalReviews} color="bg-blue-50 text-blue-600" />
          <StatCard icon={Star} label="Average Rating" value={doctorStats.avgRating || '—'} color="bg-amber-50 text-amber-600" />
          <StatCard icon={MessageSquare} label="Communication" value={doctorStats.avgCommunication || '—'} color="bg-green-50 text-green-600" />
          <StatCard icon={Clock} label="Wait Time" value={doctorStats.avgWaitTime || '—'} color="bg-purple-50 text-purple-600" />
          <StatCard icon={Heart} label="Treatment" value={doctorStats.avgTreatment || '—'} color="bg-rose-50 text-rose-600" />
        </div>

        {doctorStats.totalReviews > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Rating Distribution</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((s) => (
                <RatingBar key={s} label={`${s} star`} value={doctorStats.distribution[s]} total={doctorStats.totalReviews} />
              ))}
            </div>
          </div>
        )}

        {doctorStats.recentFeedback?.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Feedback</h2>
            <div className="space-y-3">
              {doctorStats.recentFeedback.map((f) => (
                <FeedbackCard key={f.id} feedback={f} />
              ))}
            </div>
          </div>
        )}

        {doctorStats.totalReviews === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No patient feedback yet</p>
            <p className="text-sm text-slate-400 mt-1">Feedback will appear here after patients rate their appointments</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <p className="text-slate-500">No satisfaction data available.</p>
    </div>
  );
}
