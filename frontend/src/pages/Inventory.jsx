import React, { useState, useEffect } from 'react';
import { useAuth } from '../data/AuthContext';
import { ROLES } from '../data/roles';
import { inventoryService } from '../services/inventory.service';
import { Plus, Search, Edit2, Trash2, PackageSearch, AlertCircle } from 'lucide-react';

export default function Inventory() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === ROLES.ADMIN;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    item_name: '', category: 'Surgical', quantity: 0, unit: 'boxes', reorder_level: 10, expiry_date: '', supplier: '', location: ''
  });

  const categories = ['All', 'Surgical', 'Stationery', 'Medical Equipment', 'Consumables'];

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const data = await inventoryService.getAll();
      setItems(data);
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
      alert('Failed to save inventory item');
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

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900 mb-2">Inventory Management</h1>
          <p className="text-slate-600">Track and manage hospital equipment and supplies</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        )}
      </div>

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
                  <th className="p-4">Stock</th>
                  <th className="p-4 hidden md:table-cell">Expiry / Location</th>
                  {isAdmin && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => {
                  const isLowStock = item.quantity <= item.reorder_level;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{item.item_name}</div>
                        <div className="text-sm text-slate-500 hidden sm:block">Supplier: {item.supplier || 'N/A'}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}>
                            {item.quantity}
                          </span>
                          <span className="text-slate-500 text-sm">{item.unit}</span>
                          {isLowStock && (
                            <AlertCircle className="w-4 h-4 text-red-500" title={`Low stock! Reorder level is ${item.reorder_level}`} />
                          )}
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="text-sm">
                          {item.expiry_date && <div className="text-slate-900">Exp: {new Date(item.expiry_date).toLocaleDateString()}</div>}
                          {item.location && <div className="text-slate-500">Loc: {item.location}</div>}
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
                  <label className="text-sm font-medium text-slate-700">Supplier</label>
                  <input name="supplier" value={formData.supplier} onChange={handleInputChange} className="input-field w-full" placeholder="e.g. MediSupply Co." />
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
                  <label className="text-sm font-medium text-slate-700">Expiry Date</label>
                  <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleInputChange} className="input-field w-full" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Location</label>
                  <input name="location" value={formData.location} onChange={handleInputChange} className="input-field w-full" placeholder="e.g. Main Store Room A" />
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
    </div>
  );
}
