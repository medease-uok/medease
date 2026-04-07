import { useState, useEffect } from 'react';
import { auditService } from '../services/audit.service';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { ClipboardList, Search } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    page: 1, limit: 20, search: '', action: '', resource_type: '', success: '', from: '', to: ''
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });

  useEffect(() => {
    fetchLogs(filters.page);
  }, [filters.page]);

  const fetchLogs = async (currentPage = filters.page) => {
    setLoading(true);
    setError('');
    try {
      const activeFilters = { ...filters, page: currentPage };
      Object.keys(activeFilters).forEach(k => {
        if (activeFilters[k] === '') delete activeFilters[k];
      });
      
      const res = await auditService.getLogs(activeFilters);
      setLogs(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Error fetching audit logs', err);
      setError('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 20, search: '', action: '', resource_type: '', success: '', from: '', to: ''});
    // fetchLogs will be triggered by page reset if it was > 1, otherwise explicitly call
    setTimeout(() => fetchLogs(1), 0);
  };

  // Pagination Math
  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-8 h-8 text-indigo-600" />
          Audit Logs
        </h1>
        <p className="text-slate-500 mt-1">Review system activity and security events.</p>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b bg-slate-50">
          <form className="flex flex-wrap gap-4 items-end" onSubmit={handleSearch}>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-slate-500 uppercase">Search Details/User</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  name="search"
                  placeholder="Search email, names, or json data..."
                  className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={filters.search}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            
            <div className="w-40">
              <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
              <select name="success" value={filters.success} onChange={handleFilterChange} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="">All</option>
                <option value="true">Success</option>
                <option value="false">Failed</option>
              </select>
            </div>

            <div className="w-40">
              <label className="text-xs font-semibold text-slate-500 uppercase">From Date</label>
              <input type="date" name="from" value={filters.from} onChange={handleFilterChange} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div className="w-40">
              <label className="text-xs font-semibold text-slate-500 uppercase">To Date</label>
              <input type="date" name="to" value={filters.to} onChange={handleFilterChange} className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              Apply Filters
            </button>
            <button type="button" onClick={clearFilters} className="px-4 py-2 bg-white border text-slate-600 rounded-lg hover:bg-slate-50 transition">
              Clear
            </button>
          </form>
        </CardHeader>
        <CardContent className="pt-6">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && logs.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-500 flex justify-center items-center"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></TableCell></TableRow>
                ) : logs.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-500">No audit logs found matching criteria.</TableCell></TableRow>
                ) : (
                  logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {log.user_email ? (
                          <div>
                            <p className="font-medium text-slate-900">{log.user_first_name} {log.user_last_name}</p>
                            <p className="text-xs text-slate-400">{log.user_email}</p>
                            <span className="text-[10px] uppercase bg-slate-100 text-slate-600 px-1 rounded inline-block mt-0.5">{log.user_role}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-sm">System / Anonymous</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium uppercase text-xs tracking-wider">{log.action}</TableCell>
                      <TableCell>
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium">
                           {log.resource_type}
                        </span>
                        {log.resource_id && <p className="text-[10px] text-slate-400 mt-1 font-mono truncate max-w-[120px]" title={log.resource_id}>{log.resource_id}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.success ? 'success' : 'destructive'}>
                          {log.success ? 'Success' : 'Failed'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{log.ip_address || 'N/A'}</TableCell>
                      <TableCell className="max-w-[250px]">
                        {log.details ? (
                          <div className="max-h-24 overflow-y-auto text-xs bg-slate-50 p-2 rounded border font-mono whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </div>
                        ) : <span className="text-slate-400">-</span>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-slate-500">
              Showing {(pagination.page - 1) * pagination.limit + (logs.length > 0 ? 1 : 0)} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
            </p>
            <div className="flex gap-2">
              <button 
                disabled={pagination.page <= 1} 
                onClick={() => setFilters(p => ({...p, page: p.page - 1}))}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-slate-50 transition"
              >
                Previous
              </button>
              <button 
                disabled={pagination.page >= totalPages} 
                onClick={() => setFilters(p => ({...p, page: p.page + 1}))}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-slate-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
