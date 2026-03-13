import { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react'
import {
  HeartPulse, AlertCircle, Search, User, Calendar, X,
  Plus, CheckCircle2, AlertTriangle, XCircle, Eye,
  Edit2, Trash2, Pill, FileText, Activity, Stethoscope,
} from 'lucide-react'
import { useAuth } from '../data/AuthContext'
import api from '../services/api'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const SKELETON_COUNT = 6
const STATUSES = ['active', 'managed', 'resolved', 'monitoring']
const SEVERITIES = ['mild', 'moderate', 'severe']

const STATUS_CONFIG = {
  active: { label: 'Active', variant: 'destructive', icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
  managed: { label: 'Managed', variant: 'success', icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
  resolved: { label: 'Resolved', variant: 'default', icon: CheckCircle2, color: 'text-slate-600 bg-slate-100' },
  monitoring: { label: 'Monitoring', variant: 'warning', icon: Eye, color: 'text-amber-600 bg-amber-100' },
}

const SEVERITY_CONFIG = {
  mild: { label: 'Mild', color: 'text-green-700 bg-green-50 border-green-200' },
  moderate: { label: 'Moderate', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  severe: { label: 'Severe', color: 'text-red-700 bg-red-50 border-red-200' },
}

const formatDate = (iso) => {
  if (!iso) return '-'
  const date = new Date(iso)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const matchesSearch = (c, query) => {
  const q = query.toLowerCase()
  return ['conditionName', 'treatment', 'medications', 'notes', 'diagnosedByName']
    .some((f) => c[f]?.toLowerCase().includes(q))
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return null
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

function SeverityBadge({ severity }) {
  const cfg = SEVERITY_CONFIG[severity]
  if (!cfg) return null
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

function ConditionCard({ condition, showPatient, canEdit, canDelete, onEdit, onDelete }) {
  const cfg = STATUS_CONFIG[condition.status] || STATUS_CONFIG.active
  const StatusIcon = cfg.icon

  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${cfg.color} flex items-center justify-center flex-shrink-0`}>
            <StatusIcon className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{condition.conditionName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <SeverityBadge severity={condition.severity} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <StatusBadge status={condition.status} />
          {(canEdit || canDelete) && (
            <div className="ml-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {canEdit && (
                <button onClick={() => onEdit(condition)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="Edit">
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {canDelete && (
                <button onClick={() => onDelete(condition)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {showPatient && condition.patientName && (
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{condition.patientName}</span>
          </div>
        )}
        {condition.treatment && (
          <div className="flex items-start gap-2 text-slate-600">
            <Activity className="w-3.5 h-3.5 mt-0.5 text-slate-400" aria-hidden="true" />
            <span className="line-clamp-2">{condition.treatment}</span>
          </div>
        )}
        {condition.medications && (
          <div className="flex items-start gap-2 text-slate-600">
            <Pill className="w-3.5 h-3.5 mt-0.5 text-slate-400" aria-hidden="true" />
            <span className="line-clamp-2">{condition.medications}</span>
          </div>
        )}
        {condition.diagnosedByName && (
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>Dr. {condition.diagnosedByName}</span>
          </div>
        )}
        {condition.notes && (
          <div className="flex items-start gap-2 text-slate-500">
            <FileText className="w-3.5 h-3.5 mt-0.5 text-slate-400" aria-hidden="true" />
            <span className="line-clamp-2">{condition.notes}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
          {condition.diagnosedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Diagnosed {formatDate(condition.diagnosedDate)}</span>
            </div>
          )}
          {condition.resolvedDate && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Resolved {formatDate(condition.resolvedDate)}</span>
            </div>
          )}
        </div>

        {/* Related prescriptions */}
        {condition.relatedPrescriptions?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Pill className="w-3 h-3" /> Prescriptions ({condition.relatedPrescriptions.length})
            </p>
            <div className="space-y-1.5">
              {condition.relatedPrescriptions.map((rx) => (
                <div key={rx.id} className="flex items-center justify-between text-xs bg-orange-50 rounded-lg px-2.5 py-1.5">
                  <span className="font-medium text-slate-700">{rx.medication} {rx.dosage}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                    rx.status === 'active' ? 'bg-green-100 text-green-700' :
                    rx.status === 'dispensed' ? 'bg-slate-100 text-slate-600' :
                    rx.status === 'expired' ? 'bg-red-100 text-red-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {rx.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related medical records */}
        {condition.relatedRecords?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Stethoscope className="w-3 h-3" /> Diagnoses ({condition.relatedRecords.length})
            </p>
            <div className="space-y-1.5">
              {condition.relatedRecords.map((mr) => (
                <div key={mr.id} className="text-xs bg-blue-50 rounded-lg px-2.5 py-1.5">
                  <p className="font-medium text-slate-700">{mr.diagnosis}</p>
                  {mr.doctorName && <p className="text-slate-500 mt-0.5">{mr.doctorName}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 p-5 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-100 rounded" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ConditionModal({ condition, patients, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    patientId: condition?.patientId || '',
    conditionName: condition?.conditionName || '',
    severity: condition?.severity || 'moderate',
    diagnosedDate: condition?.diagnosedDate?.slice(0, 10) || '',
    resolvedDate: condition?.resolvedDate?.slice(0, 10) || '',
    treatment: condition?.treatment || '',
    medications: condition?.medications || '',
    status: condition?.status || 'active',
    notes: condition?.notes || '',
  })

  const isEdit = !!condition
  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edit Chronic Condition' : 'Add Chronic Condition'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isEdit && patients && patients.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Patient</label>
              <select value={form.patientId} onChange={handleChange('patientId')} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Condition Name *</label>
            <input type="text" value={form.conditionName} onChange={handleChange('conditionName')} required maxLength={255}
              placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
              <select value={form.severity} onChange={handleChange('severity')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select value={form.status} onChange={handleChange('status')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosed Date</label>
              <input type="date" value={form.diagnosedDate} onChange={handleChange('diagnosedDate')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Resolved Date</label>
              <input type="date" value={form.resolvedDate} onChange={handleChange('resolvedDate')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Treatment</label>
            <textarea value={form.treatment} onChange={handleChange('treatment')} maxLength={1000} rows={2}
              placeholder="Treatment plan details..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" />
            <p className="text-xs text-slate-400 mt-1">{form.treatment.length}/1000</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Medications</label>
            <textarea value={form.medications} onChange={handleChange('medications')} maxLength={1000} rows={2}
              placeholder="Current medications for this condition..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" />
            <p className="text-xs text-slate-400 mt-1">{form.medications.length}/1000</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={handleChange('notes')} maxLength={1000} rows={2}
              placeholder="Additional clinical notes..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" />
            <p className="text-xs text-slate-400 mt-1">{form.notes.length}/1000</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ condition, onClose, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm m-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Delete Condition</h3>
        </div>
        <p className="text-sm text-slate-600 mb-6">
          Are you sure you want to delete <span className="font-medium">{condition.conditionName}</span>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ChronicConditions({ embedded = false }) {
  const { currentUser } = useAuth()
  const role = currentUser?.role
  const isPatient = role === 'patient'
  const isStaff = ['doctor', 'nurse', 'admin'].includes(role)
  const canCreate = ['doctor', 'admin'].includes(role)
  const canEdit = ['doctor', 'admin'].includes(role)
  const canDelete = role === 'admin'

  const [conditions, setConditions] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [statusFilter, setStatusFilter] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false)

  const fetchConditions = useCallback(async () => {
    try {
      setError(null)
      if (isPatient) {
        const meRes = await api.get('/patients/me')
        const patientId = meRes.data.id
        const res = await api.get(`/patients/${patientId}/chronic-conditions`)
        setConditions(res.data)
      } else if (isStaff) {
        if (selectedPatient) {
          const res = await api.get(`/patients/${selectedPatient}/chronic-conditions`)
          setConditions(res.data)
        } else {
          setConditions([])
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load chronic condition records.')
    } finally {
      setLoading(false)
    }
  }, [isPatient, isStaff, selectedPatient])

  const fetchPatients = useCallback(async () => {
    if (!isStaff) return
    try {
      const res = await api.get('/patients')
      setPatients(res.data)
      if (res.data.length > 0 && !selectedPatient) {
        setSelectedPatient(res.data[0].id)
        setPatientSearch(`${res.data[0].firstName} ${res.data[0].lastName}`)
      }
    } catch {
      // non-critical
    }
  }, [isStaff, selectedPatient])

  useEffect(() => { fetchPatients() }, [fetchPatients])
  useEffect(() => { fetchConditions() }, [fetchConditions])

  const handleSave = async (form) => {
    setSaving(true)
    try {
      const patientId = isPatient ? conditions[0]?.patientId || (await api.get('/patients/me')).data.id : form.patientId || selectedPatient
      const body = {
        conditionName: form.conditionName,
        severity: form.severity,
        diagnosedDate: form.diagnosedDate || undefined,
        resolvedDate: form.resolvedDate || undefined,
        treatment: form.treatment || undefined,
        medications: form.medications || undefined,
        status: form.status,
        notes: form.notes || undefined,
      }

      if (editTarget) {
        await api.patch(`/patients/${patientId}/chronic-conditions/${editTarget.id}`, body)
      } else {
        await api.post(`/patients/${patientId}/chronic-conditions`, body)
      }

      setShowModal(false)
      setEditTarget(null)
      await fetchConditions()
    } catch (err) {
      alert(err.message || 'Failed to save chronic condition record.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/patients/${deleteTarget.patientId}/chronic-conditions/${deleteTarget.id}`)
      setDeleteTarget(null)
      await fetchConditions()
    } catch (err) {
      alert(err.message || 'Failed to delete chronic condition record.')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = useMemo(() => {
    let items = conditions
    if (deferredSearch) items = items.filter((c) => matchesSearch(c, deferredSearch))
    if (statusFilter) items = items.filter((c) => c.status === statusFilter)
    return items
  }, [conditions, deferredSearch, statusFilter])

  const stats = useMemo(() => ({
    total: conditions.length,
    active: conditions.filter((c) => c.status === 'active').length,
    managed: conditions.filter((c) => c.status === 'managed').length,
    monitoring: conditions.filter((c) => c.status === 'monitoring').length,
  }), [conditions])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><div className="h-7 bg-slate-200 rounded w-48 animate-pulse" /></div>
        </div>
        <ListSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading text-slate-900">Chronic Conditions</h1>
            <p className="text-sm text-slate-500 mt-1">Track ongoing conditions and treatment plans</p>
          </div>
          {canCreate && (
            <button
              onClick={() => { setEditTarget(null); setShowModal(true) }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Condition
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {isStaff && patients.length > 0 && (
                <div className="relative">
                  <label htmlFor="cc-patient" className="sr-only">Search patients</label>
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="cc-patient"
                    type="text"
                    value={patientSearch}
                    onChange={(e) => { setPatientSearch(e.target.value); setPatientDropdownOpen(true) }}
                    onFocus={() => setPatientDropdownOpen(true)}
                    placeholder="Search patients..."
                    className="w-full sm:w-56 pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  />
                  {patientDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setPatientDropdownOpen(false)} />
                      <div className="absolute left-0 mt-1 w-full sm:w-72 bg-white rounded-lg border border-slate-200 shadow-lg z-20 max-h-60 overflow-y-auto">
                        {patients
                          .filter((p) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearch.toLowerCase()))
                          .map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setSelectedPatient(p.id)
                                setPatientSearch(`${p.firstName} ${p.lastName}`)
                                setPatientDropdownOpen(false)
                                setLoading(true)
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${selectedPatient === p.id ? 'bg-primary/10 text-primary font-medium' : 'text-slate-700'}`}
                            >
                              <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              {p.firstName} {p.lastName}
                            </button>
                          ))}
                        {patients.filter((p) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearch.toLowerCase())).length === 0 && (
                          <div className="px-4 py-3 text-sm text-slate-500 text-center">No patients found</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <label htmlFor="cc-search" className="sr-only">Search conditions</label>
                <input
                  id="cc-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conditions, treatments, medications..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter(null)}
                aria-pressed={!statusFilter}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${!statusFilter ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All ({conditions.length})
              </button>
              {STATUSES.map((s) => {
                const cfg = STATUS_CONFIG[s]
                const count = conditions.filter((c) => c.status === s).length
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                    aria-pressed={statusFilter === s}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${statusFilter === s ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {cfg.label} ({count})
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => { setLoading(true); fetchConditions() }} className="ml-auto px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">Retry</button>
        </div>
      )}

      {/* Results count */}
      {!loading && !error && conditions.length > 0 && (
        <output aria-live="polite" className="block text-sm text-slate-500">
          {filtered.length} {filtered.length === 1 ? 'condition' : 'conditions'}
          {statusFilter && ` (${STATUS_CONFIG[statusFilter]?.label})`}
          {search && ` matching "${search}"`}
        </output>
      )}

      {conditions.length === 0 && !error ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <HeartPulse className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No chronic conditions</h3>
          <p className="text-sm text-slate-500 mb-4">
            {isPatient ? 'Your chronic condition records will appear here.' : 'Select a patient to view their chronic conditions.'}
          </p>
          {canCreate && selectedPatient && (
            <button
              onClick={() => { setEditTarget(null); setShowModal(true) }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Condition
            </button>
          )}
        </div>
      ) : filtered.length === 0 && conditions.length > 0 ? (
        <div className="text-center py-12">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No conditions match your search or filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <ConditionCard
              key={c.id}
              condition={c}
              showPatient={false}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={(cond) => { setEditTarget(cond); setShowModal(true) }}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {showModal && (
        <ConditionModal
          condition={editTarget}
          patients={isStaff ? patients : null}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          condition={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  )
}
