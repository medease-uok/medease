import { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Users, Stethoscope, Calendar, Pill, Activity, TrendingUp, AlertTriangle, 
  Package, LayoutDashboard, RefreshCw, LogIn, MousePointer2 
} from 'lucide-react';
import { statisticsService } from '../services/statistics.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AnimatedStatsCard } from '../components/AnimatedStatsCard';


const formatDateDay = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export default function StatisticsDashboard() {
  const [summaryData, setSummaryData] = useState(null);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [appointmentTrends, setAppointmentTrends] = useState([]);
  const [activityTrends, setActivityTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [summary, inventory, appointments, activity] = await Promise.all([
        statisticsService.getSummary(),
        statisticsService.getInventoryStats(),
        statisticsService.getAppointmentTrends(),
        statisticsService.getUserActivityStats()
      ]);

      setSummaryData(summary.data);
      setInventoryStats(inventory.data);
      setAppointmentTrends(appointments.data);
      setActivityTrends(activity.data);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
      setError('Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Crunching system data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-lg font-medium text-slate-900">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const inventoryPieData = inventoryStats ? [
    { name: 'Healthy Stock', value: Math.max(0, inventoryStats.totalItems - inventoryStats.outOfStock - inventoryStats.lowStock), color: '#10B981' },
    { name: 'Low Stock', value: inventoryStats.lowStock, color: '#F59E0B' },
    { name: 'Out of Stock', value: inventoryStats.outOfStock, color: '#EF4444' }
  ].filter(item => item.value > 0) : [];

  const inventoryStatusCards = [
    { label: 'Out of Stock', value: inventoryStats?.outOfStock || 0, color: '#EF4444', icon: AlertTriangle },
    { label: 'Low Stock', value: inventoryStats?.lowStock || 0, color: '#F59E0B', icon: AlertTriangle },
    { label: 'Expired', value: inventoryStats?.expired || 0, color: '#8B5CF6', icon: Package },
    { label: 'Expiring Soon', value: inventoryStats?.expiringSoon || 0, color: '#EC4899', icon: Package }
  ];

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900 flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-primary" />
            System Statistics
          </h1>
          <p className="text-slate-500 mt-1">
            Visual overview of MedEase platform metrics and engagement.
          </p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <AnimatedStatsCard 
          stat={{ label: 'Total Patients', value: summaryData?.totalPatients, icon: Users, color: '#3B82F6' }} 
          index={0} 
        />
        <AnimatedStatsCard 
          stat={{ label: 'Total Doctors', value: summaryData?.totalDoctors, icon: Stethoscope, color: '#10B981' }} 
          index={1} 
        />
        <AnimatedStatsCard 
          stat={{ label: 'Appointments', value: summaryData?.totalAppointments, icon: Calendar, color: '#F59E0B' }} 
          index={2} 
        />
        <AnimatedStatsCard 
          stat={{ label: 'Prescriptions', value: summaryData?.totalPrescriptions, icon: Pill, color: '#EF4444' }} 
          index={3} 
        />
        <AnimatedStatsCard 
          stat={{ label: 'Active Users', value: summaryData?.activeUsers, icon: Activity, color: '#8B5CF6' }} 
          index={4} 
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appointment Trends */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Appointment Trends
            </CardTitle>
            <CardDescription>Volume and status distribution over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={appointmentTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDateDay} 
                    stroke="#64748B" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    labelFormatter={formatDateDay}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="total" name="Total" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: '#10B981' }} />
                  <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              System Engagement
            </CardTitle>
            <CardDescription>Daily logins and total interactions across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDateDay} 
                    stroke="#64748B" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#F1F5F9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    labelFormatter={formatDateDay}
                  />
                  <Legend />
                  <Bar dataKey="totalActions" name="Total Actions" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="logins" name="User Logins" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Section */}
      <Card className="hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            Inventory Health & Compliance
          </CardTitle>
          <CardDescription>Resource availability and maintenance metrics</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-2 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryPieData}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {inventoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="md:col-span-3 grid gap-4 grid-cols-2 h-fit my-auto">
              {inventoryStatusCards.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center gap-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">{item.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                  </div>
                </div>
              ))}
              <div className="col-span-2 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <p className="text-sm font-semibold text-blue-800">Total Tracked Inventory Items</p>
                </div>
                <p className="text-xl font-bold text-blue-900">{inventoryStats?.totalItems || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
