import { useState, useEffect } from 'react';
import { auditService } from '../services/audit.service';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { ClipboardList, Search, RefreshCw, AlertCircle, Download } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    page: 1, limit: 20, search: '', action: '', resource_type: '', success: '', from: '', to: ''
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // Consolidated fetcher that doesn't rely on closures
  useEffect(() => {
    const performFetch = async () => {
      setLoading(true);
      setError('');
      
      try {
        const activeFilters = { ...filters };
        // Clean empty filters
        Object.keys(activeFilters).forEach(k => {
          if (activeFilters[k] === '') delete activeFilters[k];
        });

        const res = await auditService.getLogs(activeFilters);

        if (res && res.status === 'success') {
          setLogs(Array.isArray(res.data) ? res.data : []);
          setPagination(res.pagination || { total: 0, page: 1, limit: 20 });
        } else {
          setError(res?.message || 'Failed to fetch audit logs.');
        }
      } catch (err) {
        setError('Network error or server unavailable. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    performFetch();
  }, [filters.page, filters.search, filters.success, filters.from, filters.to, filters.action, filters.resource_type, fetchTrigger]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchCommit = (e) => {
    if (e) e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
    setFetchTrigger(prev => prev + 1); // Force fresh fetch
  };

  const handleDownload = async (format) => {
    try {
      const activeFilters = { ...filters, format };
      Object.keys(activeFilters).forEach(k => {
        if (activeFilters[k] === '') delete activeFilters[k];
      });
      
      const blob = await auditService.exportLogs(activeFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Export failed. Please check your permissions.');
    }
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 20, search: '', action: '', resource_type: '', success: '', from: '', to: '' });
    setFetchTrigger(prev => prev + 1);
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-primary" />
            Audit Logs
          </h1>
          <p className="text-slate-500 mt-1">Review system activity and security events.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleDownload('csv')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button 
            onClick={() => handleDownload('pdf')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button 
            onClick={() => setFetchTrigger(p => p + 1)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b bg-slate-50/50">
          <form className="flex flex-wrap gap-4 items-end" onSubmit={handleSearchCommit}>
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  name="search"
                  placeholder="ID, Email, or Content..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={filters.search}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            
            <div className="w-40">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
              <select name="success" value={filters.success} onChange={handleFilterChange} className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                <option value="">All Statuses</option>
                <option value="true">Success</option>
                <option value="false">Failed</option>
              </select>
            </div>

            <div className="w-40">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">From</label>
              <input type="date" name="from" value={filters.from} onChange={handleFilterChange} className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
            </div>

            <div className="w-40">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To</label>
              <input type="date" name="to" value={filters.to} onChange={handleFilterChange} className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
            </div>
            
            <div className="flex gap-2">
              <button type="submit" className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition shadow-sm font-medium">
                Apply
              </button>
              <button type="button" onClick={clearFilters} className="px-5 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition font-medium">
                Reset
              </button>
            </div>
          </form>
        </CardHeader>
        <CardContent className="pt-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-all">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>User Account</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-slate-400 font-medium animate-pulse">Synchronizing logs...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 opacity-60">
                        <ClipboardList className="w-12 h-12 text-slate-200" />
                        <p className="text-slate-500 font-medium">No results found</p>
                        <p className="text-xs text-slate-400">Try adjusting your filters or search terms</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map(log => (
                    <TableRow key={log.id} className="group hover:bg-slate-50/80 transition-colors">
                      <TableCell className="text-xs text-slate-500 font-medium">
                        {new Date(log.created_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        {log.user_email ? (
                          <div className="flex flex-col max-w-[200px]">
                            <span className="font-semibold text-slate-800 truncate">
                              {log.user_first_name || 'System'} {log.user_last_name || ''}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono truncate">{log.user_email}</span>
                            <span className="mt-1 inline-flex w-fit px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                              {log.user_role || 'Internal'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400 italic text-sm">
                            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                            Automated Process
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-[10px] font-bold px-2 py-1 rounded bg-slate-900 text-white tracking-widest">
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-700">{log.resource_type}</span>
                          {log.resource_id && (
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5" title={log.resource_id}>
                              ID: {log.resource_id.substring(0, 8)}...
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.success ? 'success' : 'destructive'} className="shadow-sm">
                          {log.success ? 'PASSED' : 'FAILED'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <button className="text-primary hover:underline text-xs font-bold" onClick={() => alert(JSON.stringify(log.details, null, 2))}>
                          Details
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && logs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-2">
              <div className="text-sm text-slate-500">
                Page <span className="font-bold text-slate-900">{pagination.page}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
                <span className="mx-2 text-slate-200">|</span>
                Total <span className="font-bold text-slate-900">{pagination.total}</span> items
              </div>
              <div className="flex items-center gap-1">
                <button 
                  disabled={pagination.page <= 1 || loading} 
                  onClick={() => setFilters(p => ({...p, page: p.page - 1}))}
                  className="px-4 py-2 text-sm font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <div className="flex gap-1 px-2">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setFilters(p => ({...p, page: pageNum}))}
                        className={`w-9 h-9 text-xs font-bold rounded-xl transition-all ${
                          pagination.page === pageNum ? 'bg-primary text-white shadow-md' : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button 
                  disabled={pagination.page >= totalPages || loading} 
                  onClick={() => setFilters(p => ({...p, page: p.page + 1}))}
                  className="px-4 py-2 text-sm font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {loading && logs.length > 0 && (
        <div className="fixed bottom-8 right-8 animate-bounce">
          <Badge className="bg-primary text-white py-2 px-4 shadow-xl border-none">
            <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
            Updating...
          </Badge>
        </div>
      )}
    </div>
  );
}
