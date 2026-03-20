import { useState, useEffect, useCallback, useRef } from 'react'
import {
  X, Plus, Trash2, Search, Pill, Upload, FileText, Image, Loader2,
  AlertCircle, BookTemplate, ChevronDown, Save, Stethoscope,
} from 'lucide-react'
import api from '../services/api'
import VoiceNoteButton from './VoiceNoteButton'

const FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'Once weekly',
  'As needed',
  'At bedtime',
  'Before meals',
  'After meals',
]

const DURATIONS = [
  '3 days',
  '5 days',
  '7 days',
  '10 days',
  '14 days',
  '1 month',
  '2 months',
  '3 months',
  '6 months',
  '1 year',
  'Ongoing',
]

function MedicineSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const searchMedicines = useCallback((q) => {
    if (!q || q.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    api.get(`/medicines/search?q=${encodeURIComponent(q)}&limit=15`)
      .then((res) => {
        setResults(res.data || [])
        setOpen(true)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchMedicines(val), 300)
  }

  const handleSelect = (med) => {
    onSelect({
      medicineId: med.id,
      medication: `${med.genericName} (${med.brandName || 'Generic'})`,
      dosage: med.strength,
      frequency: '',
      duration: '',
      instructions: '',
    })
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search medicines by name, brand, or strength..."
          className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-xl max-h-64 overflow-y-auto">
          {results.map((med) => (
            <button
              key={med.id}
              type="button"
              onClick={() => handleSelect(med)}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-900">{med.genericName}</span>
                  {med.brandName && (
                    <span className="text-slate-500 ml-1.5">({med.brandName})</span>
                  )}
                </div>
                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{med.form}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {med.strength} &middot; {med.manufacturer || 'Generic'} &middot; {med.category}
              </div>
            </button>
          ))}
        </div>
      )}
      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-xl p-4 text-center text-sm text-slate-500">
          No medicines found. You can still add a custom entry below.
        </div>
      )}
    </div>
  )
}

function MedicineItemRow({ item, index, onChange, onRemove, canRemove }) {
  const update = (field, value) => onChange(index, { ...item, [field]: value })

  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
            {index + 1}
          </div>
          <span className="font-medium text-slate-900 text-sm">{item.medication || 'New Medicine'}</span>
        </div>
        {canRemove && (
          <button type="button" onClick={() => onRemove(index)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Medication *</label>
          <input
            type="text"
            value={item.medication}
            onChange={(e) => update('medication', e.target.value)}
            placeholder="Medicine name"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Dosage *</label>
          <input
            type="text"
            value={item.dosage}
            onChange={(e) => update('dosage', e.target.value)}
            placeholder="e.g. 500mg"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Frequency *</label>
          <select
            value={item.frequency}
            onChange={(e) => update('frequency', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            required
          >
            <option value="">Select frequency</option>
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Duration</label>
          <select
            value={item.duration}
            onChange={(e) => update('duration', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
          >
            <option value="">Select duration</option>
            {DURATIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Instructions</label>
        <input
          type="text"
          value={item.instructions || ''}
          onChange={(e) => update('instructions', e.target.value)}
          placeholder="e.g. Take after meals with water"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
    </div>
  )
}

export default function CreatePrescriptionModal({ patientId, patientName, onClose, onSuccess }) {
  const [mode, setMode] = useState('digital') // 'digital' or 'handwritten'
  const [items, setItems] = useState([{ medication: '', dosage: '', frequency: '', duration: '', instructions: '', medicineId: null }])
  const [notes, setNotes] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [templates, setTemplates] = useState([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDesc, setTemplateDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    api.get('/prescription-templates')
      .then((res) => setTemplates(res.data || []))
      .catch(() => {})
  }, [])

  const addMedicineFromSearch = (med) => {
    // If first item is empty, replace it
    if (items.length === 1 && !items[0].medication) {
      setItems([med])
    } else {
      setItems([...items, med])
    }
  }

  const addEmptyItem = () => {
    setItems([...items, { medication: '', dosage: '', frequency: '', duration: '', instructions: '', medicineId: null }])
  }

  const updateItem = (index, updated) => {
    setItems(items.map((item, i) => (i === index ? updated : item)))
  }

  const removeItem = (index) => {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const applyTemplate = (template) => {
    setItems(
      template.items.map((i) => ({
        medicineId: i.medicineId,
        medication: i.medication,
        dosage: i.dosage,
        frequency: i.frequency,
        duration: i.duration || '',
        instructions: i.instructions || '',
      }))
    )
    setShowTemplates(false)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return
    const validItems = items.filter((i) => i.medication && i.dosage && i.frequency)
    if (validItems.length === 0) return

    setSavingTemplate(true)
    try {
      const res = await api.post('/prescription-templates', {
        name: templateName.trim(),
        description: templateDesc.trim() || undefined,
        items: validItems,
      })
      setTemplates([res.data, ...templates])
      setShowSaveTemplate(false)
      setTemplateName('')
      setTemplateDesc('')
    } catch (err) {
      setError(err.message || 'Failed to save template.')
    } finally {
      setSavingTemplate(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (mode === 'digital') {
        const validItems = items.filter((i) => i.medication && i.dosage && i.frequency)
        if (validItems.length === 0) {
          throw new Error('Add at least one medicine with medication, dosage, and frequency.')
        }
        await api.post('/prescriptions', {
          patientId,
          type: 'digital',
          notes: notes.trim() || undefined,
          items: validItems,
        })
      } else {
        if (!image) throw new Error('Please upload a prescription image.')
        const formData = new FormData()
        formData.append('patientId', patientId)
        formData.append('type', 'handwritten')
        formData.append('image', image)
        if (notes.trim()) formData.append('notes', notes.trim())
        await api.upload('/prescriptions', formData)
      }
      onSuccess()
    } catch (err) {
      setError(err.message || 'Failed to create prescription.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">New Prescription</h2>
            {patientName && <p className="text-sm text-slate-500">For {patientName}</p>}
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-5">
            {/* Mode Toggle */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setMode('digital')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  mode === 'digital'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                Digital Prescription
              </button>
              <button
                type="button"
                onClick={() => setMode('handwritten')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  mode === 'handwritten'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Image className="w-4 h-4" />
                Handwritten (Photo)
              </button>
            </div>

            {mode === 'digital' ? (
              <>
                {/* Templates & Medicine Search */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {templates.length > 0 && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowTemplates(!showTemplates)}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
                        >
                          <BookTemplate className="w-4 h-4" />
                          Templates
                          <ChevronDown className={`w-3 h-3 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                        </button>
                        {showTemplates && (
                          <div className="absolute z-50 top-full mt-1 left-0 w-72 bg-white rounded-lg border border-slate-200 shadow-xl max-h-64 overflow-y-auto">
                            {templates.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => applyTemplate(t)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                              >
                                <div className="font-medium text-slate-900 text-sm">{t.name}</div>
                                {t.description && <div className="text-xs text-slate-500 mt-0.5">{t.description}</div>}
                                <div className="text-xs text-slate-400 mt-1">{t.items.length} medicine{t.items.length > 1 ? 's' : ''}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <MedicineSearch onSelect={addMedicineFromSearch} />
                </div>

                {/* Medicine Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700">
                      Medicines ({items.filter((i) => i.medication).length})
                    </h3>
                    <button
                      type="button"
                      onClick={addEmptyItem}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add manually
                    </button>
                  </div>

                  {items.map((item, i) => (
                    <MedicineItemRow
                      key={i}
                      item={item}
                      index={i}
                      onChange={updateItem}
                      onRemove={removeItem}
                      canRemove={items.length > 1}
                    />
                  ))}
                </div>

                {/* Save as Template */}
                {items.some((i) => i.medication && i.dosage && i.frequency) && (
                  <div>
                    {!showSaveTemplate ? (
                      <button
                        type="button"
                        onClick={() => setShowSaveTemplate(true)}
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Save as template
                      </button>
                    ) : (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-900">Save Template</span>
                          <button type="button" onClick={() => setShowSaveTemplate(false)} className="text-blue-400 hover:text-blue-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder="Template name (e.g. Hypertension Standard)"
                          className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={templateDesc}
                          onChange={(e) => setTemplateDesc(e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={handleSaveTemplate}
                          disabled={!templateName.trim() || savingTemplate}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {savingTemplate && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Handwritten Mode */
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    imagePreview
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'
                  }`}
                >
                  {imagePreview ? (
                    <div className="space-y-3">
                      {image?.type?.startsWith('image/') ? (
                        <img src={imagePreview} alt="Prescription" className="max-h-48 mx-auto rounded-lg shadow-sm" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-12 h-12 text-primary" />
                          <span className="text-sm text-slate-600">{image?.name}</span>
                        </div>
                      )}
                      <p className="text-xs text-slate-500">Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="text-sm font-medium text-slate-700">Upload prescription image</p>
                      <p className="text-xs text-slate-500">JPEG, PNG, WebP, or PDF (max 10MB)</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Notes (optional)</label>
                <VoiceNoteButton onTranscript={(t) => setNotes((v) => v ? `${v} ${t}` : t)} />
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional instructions or notes..."
                rows={2}
                maxLength={1000}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none"
              />
              <p className="text-xs text-slate-400 mt-1 text-right">{notes.length}/1000</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <Pill className="w-4 h-4" />
              {submitting ? 'Creating...' : 'Create Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
