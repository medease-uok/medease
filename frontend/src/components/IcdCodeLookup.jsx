import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Tag } from 'lucide-react'
import api from '../services/api'

/**
 * ICD-10 code search and selection component.
 *
 * Props:
 *  - value        — selected ICD-10 code string (or null)
 *  - onChange(code, description) — called when a code is selected or cleared
 *  - disabled     — disable interaction
 */
export default function IcdCodeLookup({ value, onChange, disabled = false }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  // Fetch description for pre-selected value
  useEffect(() => {
    if (value && !selected) {
      api.get('/icd10/search', { params: { q: value, limit: 1 } })
        .then((res) => {
          const match = res.data?.find(c => c.code === value)
          if (match) setSelected(match)
        })
        .catch(() => {})
    }
    if (!value) setSelected(null)
  }, [value])

  const search = useCallback((term) => {
    if (!term.trim()) { setResults([]); return }
    setLoading(true)
    api.get('/icd10/search', { params: { q: term.trim(), limit: 15 } })
      .then((res) => setResults(res.data || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [])

  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setOpen(true)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 250)
  }

  const handleSelect = (code) => {
    setSelected(code)
    setQuery('')
    setOpen(false)
    setResults([])
    onChange(code.code, code.description)
  }

  const handleClear = () => {
    setSelected(null)
    setQuery('')
    setResults([])
    onChange(null, null)
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    return () => clearTimeout(debounceRef.current)
  }, [])

  if (selected) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <Tag className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span className="font-mono font-medium text-blue-700">{selected.code}</span>
        <span className="text-slate-600 truncate">{selected.description}</span>
        {!disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="ml-auto p-0.5 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.trim() && setOpen(true)}
          disabled={disabled}
          placeholder="Search ICD-10 code or description..."
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((code) => (
            <button
              key={code.code}
              type="button"
              onClick={() => handleSelect(code)}
              className="w-full text-left px-3 py-2 hover:bg-primary/5 transition-colors flex items-start gap-2 border-b border-slate-50 last:border-0"
            >
              <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">
                {code.code}
              </span>
              <span className="text-sm text-slate-700">{code.description}</span>
              <span className="text-xs text-slate-400 ml-auto flex-shrink-0">{code.category}</span>
            </button>
          ))}
        </div>
      )}

      {open && query.trim() && !loading && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm text-slate-500 text-center">
          No ICD-10 codes found for &quot;{query}&quot;
        </div>
      )}
    </div>
  )
}
