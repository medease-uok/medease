import React, { useState, useEffect } from 'react';
import { useAuth } from '../data/AuthContext';
import { ROLES } from '../data/roles';
import { inventoryService } from '../services/inventory.service';
import { getExpiryStatus, calculateReorderSuggestion } from '../utils/inventoryUtils';
import { Plus, Search, Edit2, Trash2, PackageSearch, AlertCircle, Download, X, ShoppingCart } from 'lucide-react';
import { getPurchaseOrders, updatePurchaseOrderStatus } from '../services/purchaseOrders.service';
import { ReorderSuggestionBadge } from '../components/ReorderSuggestionBadge';

export default function Inventory() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === ROLES.ADMIN;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [showModal, setShowModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showPurchaseOrdersModal, setShowPurchaseOrdersModal] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loadingPurchaseOrders, setLoadingPurchaseOrders] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    item_name: '', category: 'Surgical', quantity: 0, unit: 'boxes', reorder_level: 10, expiry_date: '', supplier: '', location: ''
  });

  const categories = ['All', 'Surgical', 'Stationery', 'Medical Equipment', 'Consumables'];

  const fetchAuditLogs = async () => {
    if (auditLogs.length > 0) {
      setShowAuditModal(true);
      return;
    }
    setLoadingAudit(true);
    setReportError(null);
    try {
      const response = await inventoryService.getAuditLogs();
      setAuditLogs(response.data?.logs || []);
      setShowAuditModal(true);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setReportError('Failed to load transaction logs. Only 5 requests per minute are allowed.');
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showAuditModal) {
        setShowAuditModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAuditModal]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoadingPurchaseOrders(true);
      const res = await getPurchaseOrders();
      setPurchaseOrders(res.data || []);
      setShowPurchaseOrdersModal(true);
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
      alert('Failed to load purchase orders.');
    } finally {
      setLoadingPurchaseOrders(false);
    }
  };

  const handleUpdateOrderStatus = async (id, newStatus) => {
    try {
      await updatePurchaseOrderStatus(id, newStatus);
      // update state
      setPurchaseOrders(prevOptions => 
        prevOptions.map(po => po.id === id ? { ...po, status: newStatus } : po)
      );
      if (newStatus === 'RECEIVED') {
        fetchInventory(); // refresh inventory because quantity changed
      }
    } catch (error) {
      console.error('Failed to update purchase order status:', error);
      alert('Failed to update status');
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await inventoryService.getAll();
      setItems(response.data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        item_name: item.item_name || '',
        category: item.category || 'Surgical',
        quantity: item.quantity || 0,
        unit: item.unit || 'boxes',
        reorder_level: item.reorder_level || 10,
        expiry_date: item.expiry_date ? item.expiry_date.substring(0, 10) : '',
        supplier: item.supplier || '',
        location: item.location || ''
      });
    } else {
      setEditingItem(null);
      setFormData({ item_name: '', category: 'Surgical', quantity: 0, unit: 'boxes', reorder_level: 10, expiry_date: '', supplier: '', location: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await inventoryService.update(editingItem.id, formData);
      } else {
        await inventoryService.add(formData);
      }
      fetchInventory();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      setReportError(error.message || 'Failed to save inventory item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await inventoryService.delete(id);
      fetchInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleDownloadReport = async () => {
    try {
      setReportError(null);
      setDownloadingReport(true);
      const res = await inventoryService.getReport();
      const reportData = res.data;
      
      let csvContent = "data:text/csv;charset=utf-8,";
      
      const escapeCSV = (value) => {
        const str = String(value ?? '');
        const sanitized = str.replace(/^[=+\-@\t\r]/, "'$&");
        return /[,"\n\r]/.test(sanitized) ? `"${sanitized.replace(/"/g, '""')}"` : sanitized;
      };

      // Overview Section
      csvContent += "Overview\n";
      csvContent += `Total Items,${reportData.overview.total_items}\n`;
      csvContent += `Low Stock Items,${reportData.overview.low_stock_items}\n`;
      csvContent += `Out of Stock Items,${reportData.overview.out_of_stock_items}\n`;
      csvContent += `Expired Items,${reportData.overview.expired_items || 0}\n`;
      csvContent += `Expiring Soon Items (within 30 days),${reportData.overview.expiring_soon_items || 0}\n\n`;
      
      // Categories Section
      csvContent += "Category Distribution\n";
      csvContent += "Category,Item Count,Total Quantity\n";
      reportData.categories.forEach(cat => {
        csvContent += `${escapeCSV(cat.category)},${escapeCSV(cat.count)},${escapeCSV(cat.total_quantity)}\n`;
      });
      csvContent += "\n";
      
      // Trends Section
      csvContent += "Recent Trends (Last 30 Days)\n";
      csvContent += "Date,Transaction Type,Total Quantity Changed\n";
      reportData.trends.forEach(trend => {
        csvContent += `${escapeCSV(new Date(trend.date).toLocaleDateString())},${escapeCSV(trend.transaction_type)},${escapeCSV(trend.total_quantity)}\n`;
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Failed to download report:', error);
      setReportError('Failed to generate report');
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900 mb-2">Inventory Management</h1>
          <p className="text-slate-600">Track and manage hospital equipment and supplies</p>
        </div>
        {isAdmin && (
          <div className="flex gap-3">
            <button
              onClick={fetchPurchaseOrders}
              disabled={loadingPurchaseOrders}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              {loadingPurchaseOrders ? 'Loading...' : 'Purchase Orders'}
            </button>
            <button
              onClick={fetchAuditLogs} disabled={loadingAudit} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors flex items-center gap-2"> <PackageSearch className="w-5 h-5" /> {loadingAudit ? 'Loading...' : 'Audit Logs'} </button> <button onClick={handleDownloadReport}
              disabled={downloadingReport}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              {downloadingReport ? 'Generating...' : 'Download Report'}
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" />
              Add Item
            </button>
          </div>
        )}
      </div>

      {reportError && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in" role="alert">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium text-red-800">{reportError}</p>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${selectedCategory === cat
                ? 'bg-primary text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <PackageSearch className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No items found</h3>
            <p className="text-slate-500 max-w-sm">Try adjusting your search or category filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                  <th className="p-4">Item Name</th>
                  <th className="p-4">Category</th>
                    <th className="p-4 hidden sm:table-cell">Supplier</th>
                    <th className="p-4 hidden sm:table-cell">Location</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4 hidden md:table-cell">Expiry</th>
                  {isAdmin && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => {
                  const isLowStock = item.quantity <= item.reorder_level;
                  const { status: expiryStatus, daysRemaining: expiryDays } = getExpiryStatus(item.expiry_date);
                  const suggestion = (isAdmin && isLowStock) ? calculateReorderSuggestion(item.quantity, item.reorder_level) : 0;

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors group ${
                      expiryStatus === 'danger' ? 'bg-red-50/30' : 
                      expiryStatus === 'critical' ? 'bg-red-50/10' :
                      expiryStatus === 'warning' ? 'bg-amber-50/10' : ''
                    }`}>
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{item.item_name}</div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-4 hidden sm:table-cell text-sm text-slate-600">
                          {item.supplier || 'N/A'}
                        </td>
                        <td className="p-4 hidden sm:table-cell text-sm text-slate-600">
                          {item.location || '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-start justify-center">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}>
                              {item.quantity}
                            </span>
                            <span className="text-slate-500 text-sm">{item.unit}</span>
                            {isLowStock && (
                              <AlertCircle 
                                className="w-4 h-4 text-red-500" 
                                aria-label={`Low stock! Reorder level is ${item.reorder_level}.`}
                              />
                            )}
                          </div>
                          {isAdmin && isLowStock && (
                            <ReorderSuggestionBadge suggestion={suggestion} unit={item.unit} />
                          )}
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="text-sm">
                          {item.expiry_date && (
                            <div className={`flex items-center gap-1 ${
                              expiryStatus === 'danger' ? 'text-red-600 font-semibold' : 
                              expiryStatus === 'critical' ? 'text-red-500 font-medium' :
                              expiryStatus === 'warning' ? 'text-amber-600 font-semibold' : 
                              'text-slate-900'
                            }`}>
                              Exp: {new Date(item.expiry_date).toLocaleDateString()}
                              {expiryStatus !== 'normal' && (
                                <AlertCircle 
                                  className={`w-3.5 h-3.5 ${expiryStatus === 'warning' ? 'text-amber-500' : ''}`}
                                  title={expiryStatus === 'danger' ? 'Expired' : expiryStatus === 'critical' ? 'Expires today' : `Expiring in ${expiryDays} days`}
                                  aria-label={expiryStatus === 'danger' ? 'Expired' : expiryStatus === 'critical' ? 'Expires today' : `Expiring in ${expiryDays} days`}
                                  role="img"
                                />
                              )}
                            </div>
                          )}

                        </div>
                      </td>
                      {isAdmin && (
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenModal(item)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">
                {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Item Name *</label>
                  <input required name="item_name" value={formData.item_name} onChange={handleInputChange} className="input-field w-full" placeholder="e.g. Surgical Masks (N95)" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Category *</label>
                  <select required name="category" value={formData.category} onChange={handleInputChange} className="input-field w-full">
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Supplier *</label>
                  <input required name="supplier" value={formData.supplier} onChange={handleInputChange} className="input-field w-full" placeholder="e.g. MediSupply Co." />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Quantity *</label>
                  <input required type="number" min="0" name="quantity" value={formData.quantity} onChange={handleInputChange} className="input-field w-full" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Unit *</label>
                  <input required name="unit" value={formData.unit} onChange={handleInputChange} className="input-field w-full" placeholder="e.g. boxes, pieces, packs" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Reorder Level (Alert) *</label>
                  <input required type="number" min="0" name="reorder_level" value={formData.reorder_level} onChange={handleInputChange} className="input-field w-full" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Expiry Date *</label>
                  <input required type="date" name="expiry_date" value={formData.expiry_date} onChange={handleInputChange} className="input-field w-full" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Location *</label>
                  <input required name="location" value={formData.location} onChange={handleInputChange} className="input-field w-full" placeholder="e.g. Main Store Room A" />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showAuditModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAuditModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-slide-up flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Inventory Transaction Logs</h2>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-slate-600 p-2">
                 <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <p className="text-center text-slate-500">No transaction logs found.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                      <th className="p-3">Date</th>
                      <th className="p-3">Item & Category</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Qty Changed</th>
                      <th className="p-3">Reason / Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id} className="border-b border-slate-100 text-sm text-slate-700">
                        <td className="p-3">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="p-3">
                            <div className="font-medium text-slate-900">{log.item_name ?? 'Deleted Item'}</div>
                            <div className="text-xs text-slate-500">{log.category}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded inline-block text-xs font-medium ${log.transaction_type === 'IN' ? 'bg-green-100 text-green-800' : log.transaction_type === 'OUT' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {log.transaction_type}
                            </span>
                          </td>
                          <td className="p-3 font-semibold">
                            {log.transaction_type === 'OUT' ? `-${log.quantity_changed}` : `+${log.quantity_changed}`}
                          </td>
                        <td className="p-3">{log.reference || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Purchase Orders Modal */}
      {showPurchaseOrdersModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in my-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Purchase Orders</h2>
                  <p className="text-sm text-slate-500">Manage automated supplier orders</p>
                </div>
              </div>
              <button
                onClick={() => setShowPurchaseOrdersModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {loadingPurchaseOrders ? (
                <div className="flex justify-center p-8">
                  <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                </div>
              ) : purchaseOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-1">No Orders Found</h3>
                  <p className="text-slate-500">Purchase orders will be automatically generated when stock is low.</p>
                </div>
              ) : (
                <div className="bg-white border text-left border-slate-200 rounded-xl overflow-hidden content-start justify-items-start">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Item</th>
                        <th className="px-6 py-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Supplier</th>
                        <th className="px-6 py-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Qty</th>
                        <th className="px-6 py-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Status</th>
                        <th className="px-6 py-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {purchaseOrders.map((po) => (
                        <tr key={po.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">{po.item_name}</div>
                            <div className="text-xs text-slate-500">{po.category}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600">{po.supplier_name || 'Unknown'}</span>
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {po.quantity} <span className="text-slate-500 text-xs font-normal">{po.unit}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={\`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium \${
                              po.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-700' :
                              po.status === 'ORDERED' ? 'bg-blue-100 text-blue-700' :
                              po.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }\`}>
                              {po.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={po.status}
                              onChange={(e) => handleUpdateOrderStatus(po.id, e.target.value)}
                              disabled={po.status === 'RECEIVED' || po.status === 'CANCELLED'}
                              className="text-sm border border-slate-200 rounded bg-white px-2 py-1 outline-none text-slate-700 disabled:opacity-50"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="APPROVED">Approve</option>
                              <option value="ORDERED">Mark Ordered</option>
                              <option value="RECEIVED">Mark Received</option>
                              <option value="CANCELLED">Cancel</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
