import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, FlaskConical, AlertCircle, Calendar, ArrowLeft } from 'lucide-react';
import { useAuth } from '../data/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/card';

const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function LabReportsComparison() {
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patientId');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isPatient = currentUser?.role === 'patient';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTest, setSelectedTest] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = patientIdParam ? { patientId: patientIdParam } : {};
        const response = await api.get('/lab-reports/comparison', { params });
        setData(response.data);

        // Auto-select first comparable test
        if (response.data.comparableTests?.length > 0 && !selectedTest) {
          setSelectedTest(response.data.comparableTests[0]);
        }
      } catch (err) {
        console.error('Failed to fetch comparison data:', err);
        setError(err.response?.data?.message || 'Failed to load comparison data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientIdParam]);

  // Get available metrics for the selected test
  const availableMetrics = useMemo(() => {
    if (!selectedTest || !data?.reports?.[selectedTest]) return [];

    const metricsSet = new Set();
    data.reports[selectedTest].forEach((report) => {
      Object.keys(report.metrics || {}).forEach((metric) => metricsSet.add(metric));
    });

    return Array.from(metricsSet).sort();
  }, [selectedTest, data]);

  // Auto-select first 3 metrics when test changes
  useEffect(() => {
    if (availableMetrics.length > 0) {
      setSelectedMetrics(availableMetrics.slice(0, 3));
    } else {
      setSelectedMetrics([]);
    }
  }, [availableMetrics]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!selectedTest || !data?.reports?.[selectedTest] || selectedMetrics.length === 0) {
      return [];
    }

    return data.reports[selectedTest].map((report) => {
      const point = {
        date: report.date,
        formattedDate: formatDate(report.reportDate),
        notes: report.notes,
      };

      selectedMetrics.forEach((metric) => {
        point[metric] = report.metrics[metric] || null;
      });

      return point;
    });
  }, [selectedTest, selectedMetrics, data]);

  const toggleMetric = (metric) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">
            Lab Report Comparison
          </h1>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-3">
              <FlaskConical className="w-6 h-6 text-primary animate-pulse" />
              <p className="text-slate-600">Loading comparison data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">
            Lab Report Comparison
          </h1>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasComparableTests = data?.comparableTests?.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">
              Lab Report Comparison
            </h1>
            {data?.patientName && (
              <p className="text-slate-500 mt-1">
                {isPatient ? 'Your test results over time' : `Results for ${data.patientName}`}
              </p>
            )}
          </div>
        </div>
        <TrendingUp className="w-8 h-8 text-primary" />
      </div>

      {!hasComparableTests ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center max-w-md mx-auto">
              <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-slate-700">No comparable tests found</p>
              <p className="text-sm text-slate-500 mt-1">
                You need at least 2 results for the same test to compare trends over time.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Test Selector */}
          <Card>
            <CardContent className="py-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="test-select" className="block text-sm font-medium text-slate-700 mb-2">
                    Select Test Type
                  </label>
                  <select
                    id="test-select"
                    value={selectedTest}
                    onChange={(e) => setSelectedTest(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {data.comparableTests.map((test) => (
                      <option key={test} value={test}>
                        {test} ({data.reports[test].length} results)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Metric Selector */}
                {availableMetrics.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Select Metrics to Display
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableMetrics.map((metric, index) => (
                        <button
                          key={metric}
                          onClick={() => toggleMetric(metric)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            selectedMetrics.includes(metric)
                              ? 'bg-primary text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                          style={
                            selectedMetrics.includes(metric)
                              ? { backgroundColor: COLORS[selectedMetrics.indexOf(metric) % COLORS.length] }
                              : {}
                          }
                        >
                          {metric}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          {selectedMetrics.length > 0 && chartData.length > 0 && (
            <Card>
              <CardContent className="py-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Trend Over Time</h2>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                            <p className="text-sm font-semibold text-slate-900 mb-2">
                              {data.formattedDate}
                            </p>
                            {payload.map((entry, index) => (
                              <p key={index} className="text-sm" style={{ color: entry.color }}>
                                <span className="font-medium">{entry.name}:</span> {entry.value}
                              </p>
                            ))}
                            {data.notes && (
                              <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                                {data.notes}
                              </p>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Legend />
                    {selectedMetrics.map((metric, index) => (
                      <Line
                        key={metric}
                        type="monotone"
                        dataKey={metric}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={{ fill: COLORS[index % COLORS.length], r: 4 }}
                        activeDot={{ r: 6 }}
                        name={metric}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Data Table */}
          {selectedTest && data.reports[selectedTest] && (
            <Card>
              <CardContent className="py-4">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Test History</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-slate-200">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                        {selectedMetrics.map((metric) => (
                          <th key={metric} className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                            {metric}
                          </th>
                        ))}
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.reports[selectedTest].map((report) => (
                        <tr key={report.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 text-sm text-slate-900">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {formatDate(report.reportDate)}
                            </div>
                          </td>
                          {selectedMetrics.map((metric) => (
                            <td key={metric} className="py-3 px-4 text-sm text-slate-900 font-medium">
                              {report.metrics[metric] !== undefined ? report.metrics[metric] : '-'}
                            </td>
                          ))}
                          <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate">
                            {report.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
