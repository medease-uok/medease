import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Clock, Activity, ChevronRight, RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

function QueueStatusBadge({ status }) {
  const config = {
    in_progress: { variant: 'warning', label: 'Being Seen' },
    scheduled: { variant: 'default', label: 'Waiting' },
  };
  const c = config[status] || { variant: 'default', label: status };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

export default function PatientQueue({ isDoctor = false }) {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchQueue = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get('/dashboard/queue');
      setQueue(res.data.queue || []);
      setLastUpdated(new Date());
      setError(null);
      return res.data.pollInterval || 30;
    } catch {
      setError('Failed to load queue.');
      return 30;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      const pollInterval = await fetchQueue(true);
      if (mounted) {
        intervalRef.current = setInterval(() => fetchQueue(), pollInterval * 1000);
      }
    };

    start();

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const inProgress = queue.filter((q) => q.status === 'in_progress');
  const waiting = queue.filter((q) => q.status !== 'in_progress');

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            Patient Queue
          </CardTitle>
          <p className="text-sm text-slate-500 mt-0.5">
            {queue.length} patient{queue.length !== 1 ? 's' : ''} waiting today
            {lastUpdated && (
              <span className="ml-2 text-xs text-slate-400">
                Updated {formatTime(lastUpdated.toISOString())}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchQueue(true)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          title="Refresh queue"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {queue.length > 0 ? (
          <div className="space-y-4">
            {/* Currently being seen */}
            {inProgress.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-green-500" />
                  Currently Being Seen
                </p>
                <div className="space-y-2">
                  {inProgress.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => isDoctor ? navigate(`/patients/${item.patientId}`) : null}
                      className={`flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200 ${isDoctor ? 'cursor-pointer hover:bg-green-100' : ''} transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-sm font-semibold text-green-700">
                          {item.patientName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{item.patientName}</p>
                          <p className="text-xs text-slate-500">
                            {item.doctorName} &middot; {formatTime(item.scheduledAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.remainingSlots != null && (
                          <span className="text-xs text-slate-400">({item.remainingSlots} slots left)</span>
                        )}
                        <QueueStatusBadge status={item.status} />
                        {isDoctor && <ChevronRight className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Waiting queue */}
            {waiting.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Waiting ({waiting.length})
                </p>
                <div className="space-y-1">
                  {waiting.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => isDoctor ? navigate(`/patients/${item.patientId}`) : null}
                      className={`flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 ${isDoctor ? 'cursor-pointer' : ''} transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                          {item.position}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{item.patientName}</p>
                          <p className="text-xs text-slate-500">
                            {!isDoctor && <span>{item.doctorName} &middot; </span>}
                            {formatTime(item.scheduledAt)}
                            {item.notes && <span className="ml-1">— {item.notes}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.remainingSlots != null && (
                          <span className="text-xs text-slate-400">({item.remainingSlots} slots left)</span>
                        )}
                        <QueueStatusBadge status={item.status} />
                        {isDoctor && <ChevronRight className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No patients in queue</p>
            <p className="text-sm mt-1">No one is waiting to be seen today.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
