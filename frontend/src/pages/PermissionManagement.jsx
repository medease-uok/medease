import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Plus, Save, Trash2, ChevronDown, ChevronRight,
  Check, X, AlertCircle, Loader2,
} from 'lucide-react';
import api from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const categoryLabels = {
  patients: 'Patient Management',
  appointments: 'Appointments',
  medical_records: 'Medical Records',
  prescriptions: 'Prescriptions',
  lab_reports: 'Lab Reports',
  admin: 'Administration',
};

function groupByCategory(permissions) {
  const groups = {};
  for (const perm of permissions) {
    if (!groups[perm.category]) groups[perm.category] = [];
    groups[perm.category].push(perm);
  }
  return groups;
}

export default function PermissionManagement() {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [roleDetail, setRoleDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [dirty, setDirty] = useState(false);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await api.get('/roles');
      setRoles(res.data);
    } catch {
      setError('Failed to load roles.');
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await api.get('/roles/permissions');
      setAllPermissions(res.data);
      const expanded = {};
      for (const p of res.data) expanded[p.category] = true;
      setExpandedCategories(expanded);
    } catch {
      setError('Failed to load permissions.');
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchRoles(), fetchPermissions()]).finally(() => setLoading(false));
  }, [fetchRoles, fetchPermissions]);

  const selectRole = async (roleId) => {
    if (roleId === selectedRoleId) return;
    setSelectedRoleId(roleId);
    setDetailLoading(true);
    setDirty(false);
    setError('');
    setSuccess('');
    try {
      const res = await api.get(`/roles/${roleId}`);
      setRoleDetail(res.data);
      setRolePermissions(res.data.permissions.map((p) => p.id));
    } catch {
      setError('Failed to load role details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const togglePermission = (permId) => {
    setDirty(true);
    setSuccess('');
    setRolePermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const toggleAllInCategory = (category) => {
    const categoryPerms = allPermissions.filter((p) => p.category === category);
    const categoryIds = categoryPerms.map((p) => p.id);
    const allSelected = categoryIds.every((id) => rolePermissions.includes(id));

    setDirty(true);
    setSuccess('');
    if (allSelected) {
      setRolePermissions((prev) => prev.filter((id) => !categoryIds.includes(id)));
    } else {
      setRolePermissions((prev) => [...new Set([...prev, ...categoryIds])]);
    }
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/roles/${selectedRoleId}`, { permissionIds: rolePermissions });
      setDirty(false);
      setSuccess('Permissions updated successfully.');
      fetchRoles();
    } catch (err) {
      setError(err.data?.message || 'Failed to save permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    setError('');
    try {
      await api.post('/roles', {
        name: newRoleName.trim(),
        description: newRoleDescription.trim() || null,
        permissionIds: [],
      });
      setShowCreateModal(false);
      setNewRoleName('');
      setNewRoleDescription('');
      await fetchRoles();
      setSuccess('Role created successfully.');
    } catch (err) {
      setError(err.data?.message || 'Failed to create role.');
    }
  };

  const handleDeleteRole = async (roleId) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role || role.isSystem) return;
    if (!window.confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;

    setError('');
    try {
      await api.delete(`/roles/${roleId}`);
      if (selectedRoleId === roleId) {
        setSelectedRoleId(null);
        setRoleDetail(null);
        setRolePermissions([]);
      }
      await fetchRoles();
      setSuccess('Role deleted successfully.');
    } catch (err) {
      setError(err.data?.message || 'Failed to delete role.');
    }
  };

  const grouped = groupByCategory(allPermissions);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading permission management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">
            Permission Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage roles and their permissions across the system.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Role
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto text-green-400 hover:text-green-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Roles</CardTitle>
            <CardDescription>{roles.length} roles configured</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {roles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => selectRole(role.id)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                    selectedRoleId === role.id
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      selectedRoleId === role.id
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-900 capitalize truncate">
                        {role.name.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {role.permissionCount} permission{role.permissionCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {role.isSystem && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">System</Badge>
                    )}
                    {!role.isSystem && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          {!selectedRoleId ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-900">Select a role</p>
              <p className="text-sm text-slate-500 mt-1">
                Choose a role from the list to view and edit its permissions.
              </p>
            </div>
          ) : detailLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : roleDetail ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg capitalize">
                      {roleDetail.name.replace('_', ' ')} Permissions
                    </CardTitle>
                    <CardDescription>
                      {roleDetail.description || 'No description'}
                      {' '}&middot;{' '}
                      {rolePermissions.length} of {allPermissions.length} permissions enabled
                    </CardDescription>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={!dirty || saving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(grouped).map(([category, perms]) => {
                    const isExpanded = expandedCategories[category];
                    const selectedInCategory = perms.filter((p) => rolePermissions.includes(p.id)).length;
                    const allInCategorySelected = selectedInCategory === perms.length;

                    return (
                      <div key={category} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div
                          className="flex items-center justify-between px-4 py-3 bg-slate-50 cursor-pointer select-none"
                          onClick={() => toggleCategory(category)}
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            )}
                            <span className="font-semibold text-sm text-slate-700">
                              {categoryLabels[category] || category}
                            </span>
                            <Badge variant={selectedInCategory === perms.length ? 'success' : selectedInCategory > 0 ? 'warning' : 'secondary'}>
                              {selectedInCategory}/{perms.length}
                            </Badge>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleAllInCategory(category); }}
                            className="text-xs font-medium text-primary hover:text-primary-700 transition-colors"
                          >
                            {allInCategorySelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="divide-y divide-slate-100">
                            {perms.map((perm) => {
                              const isChecked = rolePermissions.includes(perm.id);
                              return (
                                <label
                                  key={perm.id}
                                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                  <div className="relative flex-shrink-0">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => togglePermission(perm.id)}
                                      className="sr-only peer"
                                    />
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                      isChecked
                                        ? 'bg-primary border-primary'
                                        : 'border-slate-300 peer-hover:border-slate-400'
                                    }`}>
                                      {isChecked && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-900">
                                      {perm.name.replace(/_/g, ' ')}
                                    </p>
                                    {perm.description && (
                                      <p className="text-xs text-slate-500 mt-0.5">{perm.description}</p>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </>
          ) : null}
        </Card>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold font-heading text-slate-900">Create New Role</h2>
              <p className="text-sm text-slate-500 mt-1">
                Custom roles can be assigned to users and configured with specific permissions.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Role Name</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. receptionist"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <input
                  type="text"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => { setShowCreateModal(false); setNewRoleName(''); setNewRoleDescription(''); }}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                disabled={!newRoleName.trim()}
                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
