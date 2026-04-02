import React, { useState, useEffect } from 'react';
import { useAuth } from '../data/AuthContext';
import { ROLES } from '../data/roles';
import { supplierService } from '../services/supplier.service';
import { Plus, Search, Edit2, Trash2, Truck, AlertCircle } from 'lucide-react';

export default function SupplierManagement() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === ROLES.ADMIN;

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '', contact_person: '', email: '', phone: '', address: '', status: 'active', notes: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, [selectedStatus]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStatus !== 'all') params.status = selectedStatus;
      
      const fetched = await supplierService.getAll(params);
      const supplierArray = Array.isArray(fetched) ? fetched : (fetched?.data || []);
      setSuppliers(supplierArray);
      setError(null);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to load suppliers.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name || '',
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        status: supplier.status || 'active',
        notes: supplier.notes || ''
      });
    } else {
      setEditingSupplier(null);
      setFormData({ name: '', contact_person: '', email: '', phone: '', address: '', status: 'active', notes: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await supplierService.update(editingSupplier.id, formData);
      } else {
        await supplierService.add(formData);
      }
      fetchSuppliers();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving supplier:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save supplier data');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate (delete) this supplier?')) return;
    try {
      await supplierService.delete(id);
      fetchSuppliers();
    } catch (err) {
      console.error('Error deleting supplier:', err);
      setError('Failed to delete supplier');
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const term = searchTerm.toLowerCase();
    return s.name.toLowerCase().includes(term) || 
           (s.contact_person && s.contact_person.toLowerCase().includes(term)) ||
           (s.email && s.email.toLowerCase().includes(term));
  });

  if (!isAdmin) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900 mb-2">Supplier Management</h1>
          <p className="text-slate-600">Track and manage medical and equipment suppliers</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Add Supplier
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in" role="alert">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, contact, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input-field max-w-[150px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <Truck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No suppliers found</h3>
            <p className="text-slate-500 max-w-sm">Try adjusting your search criteria or add a new supplier.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                  <th className="p-4">Supplier Details</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Address</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map(supplier => (
                  <tr key={supplier.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{supplier.name}</div>
                      <div className="text-sm text-slate-500 mt-0.5">{supplier.notes ? supplier.notes.substring(0, 30) + '...' : ''}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-900">{supplier.contact_person || 'N/A'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{supplier.email} </div>
                      <div className="text-xs text-slate-500">{supplier.phone}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-600 max-w-[200px] truncate" title={supplier.address}>
                        {supplier.address || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        supplier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {supplier.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(supplier)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Supplier Name *</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} className="input-field w-full" placeholder="Company Name" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Contact Person *</label>
                  <input required name="contact_person" value={formData.contact_person} onChange={handleInputChange} className="input-field w-full" placeholder="Jane Doe" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Phone *</label>
                  <input required name="phone" value={formData.phone} onChange={handleInputChange} className="input-field w-full" placeholder="+1 234 567 890" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Email *</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="input-field w-full" placeholder="contact@supplier.com" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Physical Address *</label>
                  <input required name="address" value={formData.address} onChange={handleInputChange} className="input-field w-full" placeholder="123 Industrial Way..." />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Status *</label>
                  <select required name="status" value={formData.status} onChange={handleInputChange} className="input-field w-full">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Additional Notes</label>
                  <textarea name="notes" value={formData.notes || ''} onChange={handleInputChange} className="input-field w-full min-h-[80px]" placeholder="Optional notes or tags..."></textarea>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingSupplier ? 'Save Changes' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
