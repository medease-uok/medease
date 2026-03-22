import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, FileText, Activity, Stethoscope, Pill, FlaskConical,
  CheckCircle2, XCircle, Shield, ClipboardList, UserCheck, AlertTriangle, History,
  Clock, ChevronRight,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../data/AuthContext';
import { AnimatedStatsCard } from '../components/AnimatedStatsCard';
import { QuickActions } from '../components/QuickActions';
import { ActivityFeed } from '../components/ActivityFeed';
import UserProfileCard from '../components/UserProfileCard';
import EditStaffProfileModal from '../components/EditStaffProfileModal';
import PatientQueue from '../components/PatientQueue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { inventoryService } from '../services/inventory.service';

const iconMap = {
  'Total Patients': Users,
  'Total Doctors': Stethoscope,
  'Appointments Today': Calendar,
  'Active Prescriptions': Pill,
  'Lab Reports': FlaskConical,
  'Medical Records': FileText,
  'Completed': CheckCircle2,
  'Total Reports': FlaskConical,
  'Patients Tested': Users,
  'Tests This Month': FlaskConical,
  'Pending Reviews': FileText,
  'Dispensed': Pill,
  'Expired': Pill,
  'Total Medications': Pill,
  'My Appointments': Calendar,
  'My Prescriptions': Pill,
  'My Lab Reports': FlaskConical,
  'My Records': FileText,
  'Appointments': Calendar,
  'Active Cases': Activity,
};

const roleGreetings = {
  admin: 'System overview at a glance.',
  doctor: "Here's your clinical overview for today.",
  nurse: "Here's your patient care overview.",
  patient: "Here's your health summary.",
  lab_technician: "Here's your laboratory overview.",
  pharmacist: "Here's your pharmacy overview.",
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

function AppointmentStatusBadge({ status }) {
  const variants = {
    scheduled: 'default',
    completed: 'success',
    cancelled: 'destructive',
    pending: 'warning',
  };
  return (
    <Badge variant={variants[status] || 'default'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function RoleBadge({ status }) {
  const variants = {
    patient: 'default',
    doctor: 'success',
    nurse: 'warning',
    lab_technician: 'default',
    pharmacist: 'default',
    admin: 'destructive',
  };
  return (
    <Badge variant={variants[status] || 'default'}>
      {status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    </Badge>
  );
}

function formatProfileValue(key, val) {
  if (/date|birth/i.test(key) && !isNaN(Date.parse(val))) {
    return new Date(val).toLocaleDateString();
  }
  return String(val);
}

function ProfileDetails({ profileData }) {
  const entries = Object.entries(profileData || {}).filter(([, v]) => v);
  if (entries.length === 0) return <span className="text-sm text-slate-400 italic">No additional details</span>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {entries.map(([key, val]) => (
        <div key={key} className="text-sm">
          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-0.5">
            {key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}
          </span>
          {formatProfileValue(key, val)}
        </div>
      ))}
    </div>
  );
}

const adminTabs = [
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'pending', label: 'Pending Approvals', icon: UserCheck },
  { id: 'logs', label: 'Audit Logs', icon: ClipboardList },
  { id: 'changes', label: 'Profile Changes', icon: History },
];


export default function DashboardEnhanced() {
  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const role = currentUser?.role || 'patient';
  const isAdmin = role === 'admin';
  const showProfile = !isAdmin && role !== 'patient';

  const [dashData, setDashData] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const [adminTab, setAdminTab] = useState('pending');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [profileChanges, setProfileChanges] = useState([]);
  const [adminLoading, setAdminLoading] = useState(true);
  const [adminError, setAdminError] = useState('');
  const [adminSearch, setAdminSearch] = useState('');

  useEffect(() => {
    const fetchStats = api.get('/dashboard/stats').then((statsRes) => {
      const transformedStats = statsRes.data.stats.map((stat) => {
        const change = stat.change ?? +(Math.random() * 20 - 5).toFixed(1);
        return {
          ...stat,
          icon: iconMap[stat.label] || Activity,
          change,
          trend: change > 0 ? 'up' : 'down',
        };
      });
      setDashData({ ...statsRes.data, stats: transformedStats });
    }).catch(console.error);

    const fetchActivity = api.get('/dashboard/activity').then((activityRes) => {
      setActivityData(activityRes.data || []);
    }).catch(console.error);

    const fetchProfile = showProfile
      ? api.get('/profile/me').then((profileRes) => {
          setProfileData(profileRes.data);
          if (profileRes.data.profileImageUrl) {
            updateUser({ profileImageUrl: profileRes.data.profileImageUrl });
          }
        }).catch(console.error)
      : Promise.resolve();

    const fetchInventory = ['admin', 'doctor', 'nurse', 'pharmacist'].includes(role)
      ? inventoryService.getAll().then((res) => {
          const allItems = res.data || [];
          setLowStockItems(allItems.filter(i => i.quantity <= i.reorder_level));
        }).catch(console.error)
      : Promise.resolve();

    Promise.allSettled([fetchStats, fetchActivity, fetchProfile, fetchInventory]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setAdminLoading(false);
      return;
    }
    Promise.all([
      api.get('/admin/users/pending'),
      api.get('/admin/users'),
      api.get('/admin/audit-logs'),
      api.get('/admin/profile-changes'),
    ])
      .then(([pendingRes, usersRes, logsRes, changesRes]) => {
        setPendingUsers(pendingRes.data);
        setActiveUsers(usersRes.data.filter((u) => u.isActive));
        setAuditLogs(logsRes.data);
        setProfileChanges(changesRes.data);
      })
      .catch((err) => {
        console.error(err);
        setAdminError('Failed to load admin data. Please refresh the page.');
      })
      .finally(() => setAdminLoading(false));
  }, [isAdmin]);

  const handleApprove = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/approve`);
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}/reject`);
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQuickAction = (_actionId, path) => {
    if (path) navigate(path);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashData) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Dashboard</CardTitle>
          <CardDescription>Failed to load dashboard data. Please try refreshing.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { stats, todayAppointments = [], upcomingAppointments = [] } = dashData;

  const filteredUsers = activeUsers.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email} ${u.role}`.toLowerCase().includes(adminSearch.toLowerCase())
  );
  const filteredLogs = auditLogs.filter((l) =>
    `${l.userName} ${l.action} ${l.resourceType} ${l.ipAddress}`.toLowerCase().includes(adminSearch.toLowerCase())
  );
  const filteredChanges = profileChanges.filter((c) =>
    `${c.patientName} ${c.fieldName} ${c.changedByName} ${c.oldValue} ${c.newValue}`.toLowerCase().includes(adminSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">
          Welcome, {currentUser?.firstName || 'User'}
        </h1>
        <p className="text-slate-500 mt-1">
          {roleGreetings[role] || 'Welcome to your dashboard.'}
        </p>
      </div>

      {showProfile && profileData && (
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <AnimatedStatsCard key={stat.label} stat={stat} index={index} />
        ))}
      </div>

      <QuickActions onActionClick={handleQuickAction} role={role} />

      {/* Appointments Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Appointments */}
        <div className="lg:col-span-2">
          <Card className="h-full hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Today's Appointments
                </CardTitle>
                <CardDescription>
                  {todayAppointments.length} appointment{todayAppointments.length !== 1 ? 's' : ''} scheduled for today
                </CardDescription>
              </div>
              <button
                onClick={() => navigate('/appointments')}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </CardHeader>
            <CardContent>
              {todayAppointments.length > 0 ? (
                <div className="space-y-2">
                  {todayAppointments.map((apt) => {
                    const nameField = role === 'patient' ? apt.doctorName : apt.patientName;
                    return (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
                            {nameField.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900">{nameField}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(apt.scheduledAt)}
                              {apt.notes && <span className="ml-1">— {apt.notes}</span>}
                            </p>
                          </div>
                        </div>
                        <AppointmentStatusBadge status={apt.status} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No appointments today</p>
                  <p className="text-sm mt-1">Your schedule is clear.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <Card className="h-full hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Upcoming
            </CardTitle>
            <CardDescription>{upcomingAppointments.length} scheduled</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => {
                  const nameField = role === 'patient' ? apt.doctorName : apt.patientName;
                  return (
                    <div
                      key={apt.id}
                      className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm text-slate-900">{nameField}</p>
                        <AppointmentStatusBadge status={apt.status} />
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatDate(apt.scheduledAt)} at {formatTime(apt.scheduledAt)}
                      </p>
                    </div>
                  );
                })}
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

      {/* Patient Queue — visible to clinical staff */}
      {['admin', 'nurse', 'doctor'].includes(role) && (
        <PatientQueue />
      )}

      {/* Low Stock Alerts */}
      {['admin', 'doctor', 'nurse', 'pharmacist'].includes(role) && lowStockItems.length > 0 && (
        <Card className="border-red-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="bg-red-50 pb-3 border-b border-red-100 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription className="text-red-600/80">
              {lowStockItems.length} items need immediate restocking
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lowStockItems.map(item => (
                <div key={item.id} className="p-3 border border-red-100 rounded-lg bg-red-50/30 flex justify-between items-center transition-colors hover:bg-red-50/80">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm whitespace-nowrap overflow-hidden text-ellipsis">{item.item_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Threshold: <span className="font-medium text-slate-700">{item.reorder_level}</span> {item.unit}</p>
                  </div>
                  <div className="text-right min-w-fit ml-4">
                    <p className="font-bold text-red-600 text-lg leading-tight">{item.quantity} <span className="text-xs font-semibold text-red-500/80 uppercase tracking-wider">{item.unit}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Feed */}
      <div>
        <ActivityFeed activities={activityData} maxItems={8} />
      </div>

      {isAdmin && (
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Administration</CardTitle>
                <CardDescription>Manage users, approvals, and audit logs</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {adminLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : adminError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {adminError}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-1 border-b border-slate-200">
                  {adminTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => { setAdminTab(tab.id); setAdminSearch(''); }}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${
                          adminTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                        {tab.id === 'pending' && pendingUsers.length > 0 && (
                          <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white">
                            {pendingUsers.length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {adminTab !== 'pending' && (
                  <input
                    type="text"
                    placeholder="Search..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="w-full max-w-sm px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                )}

                {adminTab === 'users' && (
                  <div className="rounded-md border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Phone</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((user, idx) => (
                            <TableRow key={user.id || idx}>
                              <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell><RoleBadge status={user.role} /></TableCell>
                              <TableCell>{user.phone || '-'}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                              No users found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {adminTab === 'pending' && (
                  pendingUsers.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <p className="text-sm font-semibold text-amber-800">
                          {pendingUsers.length} user{pendingUsers.length > 1 ? 's' : ''} waiting for approval
                        </p>
                      </div>
                      {pendingUsers.map((user) => (
                        <div key={user.id} className="border border-slate-200 rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-200">
                            <div>
                              <p className="font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-slate-500 mt-0.5">{user.email} &middot; {user.phone || 'No phone'}</p>
                            </div>
                            <RoleBadge status={user.role} />
                          </div>
                          <div className="p-5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Registration Details</p>
                            <ProfileDetails profileData={user.profileData} />
                          </div>
                          <div className="flex gap-3 p-4 bg-slate-50 border-t border-slate-200">
                            <button
                              onClick={() => handleApprove(user.id)}
                              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(user.id)}
                              className="flex items-center gap-2 px-5 py-2.5 border border-red-300 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <XCircle className="w-4 h-4" /> Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-7 h-7 text-green-600" />
                      </div>
                      <p className="font-semibold text-slate-900">All caught up!</p>
                      <p className="text-sm text-slate-500 mt-1">No pending approvals at the moment.</p>
                    </div>
                  )
                )}

                {adminTab === 'logs' && (
                  <div className="rounded-md border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Resource</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLogs.length > 0 ? (
                          filteredLogs.map((log, idx) => (
                            <TableRow key={log.id || idx}>
                              <TableCell className="font-medium">{log.userName}</TableCell>
                              <TableCell>{log.action}</TableCell>
                              <TableCell>{log.resourceType}</TableCell>
                              <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                              <TableCell>
                                <span className={`font-semibold ${log.success ? 'text-green-600' : 'text-red-600'}`}>
                                  {log.success ? 'Success' : 'Failed'}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm">{new Date(log.createdAt).toLocaleString()}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                              No logs found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {adminTab === 'changes' && (
                  <div className="rounded-md border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Field</TableHead>
                          <TableHead>Old Value</TableHead>
                          <TableHead>New Value</TableHead>
                          <TableHead>Changed By</TableHead>
                          <TableHead>Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredChanges.length > 0 ? (
                          filteredChanges.map((change, idx) => (
                            <TableRow key={change.id}>
                              <TableCell className="font-medium">{change.patientName}</TableCell>
                              <TableCell>
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded font-medium">
                                  {change.fieldName}
                                </span>
                              </TableCell>
                              <TableCell className="text-red-600 text-sm max-w-[150px] truncate" title={change.oldValue || '-'}>
                                {change.oldValue || <span className="text-slate-400 italic">empty</span>}
                              </TableCell>
                              <TableCell className="text-green-600 text-sm max-w-[150px] truncate" title={change.newValue || '-'}>
                                {change.newValue || <span className="text-slate-400 italic">empty</span>}
                              </TableCell>
                              <TableCell className="text-sm">
                                {change.changedByName}
                                {change.changedByRole && (
                                  <span className="ml-1 text-xs text-slate-400">({change.changedByRole})</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">{new Date(change.createdAt).toLocaleString()}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                              No profile changes recorded
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
