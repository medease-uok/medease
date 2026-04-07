import { useState, useEffect } from 'react';
import { useAuth } from '../data/AuthContext';
import { reportService } from '../services/report.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { FileText, Package, TrendingDown, CalendarDays, Truck, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const reportTabs = [
  { id: 'inventory-status', label: 'Inventory Status', icon: Package },
  { id: 'monthly-usage', label: 'Monthly Usage', icon: TrendingDown },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'suppliers', label: 'Supplier Orders', icon: Truck },
];

export default function Reports() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inventory-status');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        let res;
        switch (activeTab) {
          case 'inventory-status':
            res = await reportService.getInventoryStatus();
            break;
          case 'monthly-usage':
            res = await reportService.getMonthlyUsage();
            break;
          case 'appointments':
            res = await reportService.getAppointmentSummary();
            break;
          case 'suppliers':
            res = await reportService.getSupplierOrders();
            break;
          default:
            res = { data: [] };
        }
        setData(res.data || []);
      } catch (err) {
        console.error('Error fetching report', err);
        setError('Failed to load report data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const handleExport = async (format) => {
    setExporting(format);
    try {
      await reportService.exportReport(activeTab, format);
    } catch (err) {
      console.error(`Error exporting ${format}`, err);
      setError(`Failed to export report as ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="w-8 h-8 text-indigo-600" />
            System Reports
          </h1>
          <p className="text-slate-500 mt-1">View system-wide analytics and data summaries.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting !== null || loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {exporting === 'csv' ? <div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin"></div> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null || loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {exporting === 'pdf' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Download className="w-4 h-4" />}
            Export PDF
          </button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex gap-4">
            {reportTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {loading ? (
            <div className="flex justify-center items-center h-48">
               <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    {activeTab === 'inventory-status' && (
                      <>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expiry</TableHead>
                      </>
                    )}
                    {activeTab === 'monthly-usage' && (
                      <>
                        <TableHead>Month</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Total Used</TableHead>
                      </>
                    )}
                    {activeTab === 'appointments' && (
                      <>
                        <TableHead>Date</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Specialty</TableHead>
                        <TableHead>Status</TableHead>
                      </>
                    )}
                    {activeTab === 'suppliers' && (
                      <>
                        <TableHead>Supplier</TableHead>
                        <TableHead className="text-right">Total Orders</TableHead>
                        <TableHead className="text-right">Pending</TableHead>
                        <TableHead className="text-right">Received</TableHead>
                        <TableHead>Last Order</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={activeTab === 'monthly-usage' ? 4 : 5} className="text-center h-32 text-slate-500">
                        No data available for this report.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => {
                      const rowKey = row.id || row.inventory_id || row.appointment_id || row.supplier_id || row.item_name || Math.random();
                      return (
                      <TableRow key={rowKey}>
                        {activeTab === 'inventory-status' && (
                          <>
                            <TableCell className="font-medium">{row.item_name}</TableCell>
                            <TableCell>{row.category}</TableCell>
                            <TableCell className="text-right">{row.quantity} {row.unit}</TableCell>
                            <TableCell>
                              <Badge variant={row.stock_status === 'Healthy' ? 'success' : row.stock_status === 'Out of Stock' ? 'destructive' : 'warning'}>
                                {row.stock_status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={row.expiry_status === 'Valid' ? 'success' : row.expiry_status === 'Expired' ? 'destructive' : 'warning'}>
                                {row.expiry_status !== 'Valid' ? row.expiry_status : new Date(row.expiry_date).toLocaleDateString()}
                              </Badge>
                            </TableCell>
                          </>
                        )}
                        {activeTab === 'monthly-usage' && (
                          <>
                            <TableCell>{new Date(row.usage_month).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</TableCell>
                            <TableCell className="font-medium">{row.item_name}</TableCell>
                            <TableCell>{row.category}</TableCell>
                            <TableCell className="text-right font-bold">{row.total_quantity_used}</TableCell>
                          </>
                        )}
                        {activeTab === 'appointments' && (
                          <>
                            <TableCell>{new Date(row.appointment_day).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium">{row.patient_name}</TableCell>
                            <TableCell>Dr. {row.doctor_name}</TableCell>
                            <TableCell>{row.specialty}</TableCell>
                            <TableCell>
                              <Badge variant={row.status === 'completed' ? 'success' : row.status === 'cancelled' ? 'destructive' : 'default'}>
                                {row.status}
                              </Badge>
                            </TableCell>
                          </>
                        )}
                        {activeTab === 'suppliers' && (
                          <>
                            <TableCell className="font-medium">{row.supplier_name}</TableCell>
                            <TableCell className="text-right">{row.total_orders}</TableCell>
                            <TableCell className="text-right text-orange-600">{row.pending_orders}</TableCell>
                            <TableCell className="text-right text-green-600">{row.received_orders}</TableCell>
                            <TableCell>{row.last_order_date ? new Date(row.last_order_date).toLocaleDateString() : 'N/A'}</TableCell>
                          </>
                        )}
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
