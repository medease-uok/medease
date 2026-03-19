import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Circle, CheckCircle2, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import api from '../services/api'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export default function DoctorTaskWidget() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [adding, setAdding] = useState(false)
  const [togglingIds, setTogglingIds] = useState(new Set())

  const fetchTasks = useCallback(() => {
    api.get('/doctor-tasks')
      .then((res) => setTasks(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      const res = await api.post('/doctor-tasks', {
        title: newTitle.trim(),
        dueDate: newDueDate || null,
      })
      setTasks((prev) => [res.data, ...prev])
      setNewTitle('')
      setNewDueDate('')
    } catch (err) {
      console.error('Failed to add task:', err)
    } finally {
      setAdding(false)
    }
  }

  const handleToggle = async (task) => {
    setTogglingIds((prev) => new Set(prev).add(task.id))
    try {
      const res = await api.patch(`/doctor-tasks/${task.id}`, {
        isCompleted: !task.isCompleted,
      })
      setTasks((prev) => prev.map((t) => (t.id === task.id ? res.data : t)))
    } catch (err) {
      console.error('Failed to toggle task:', err)
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(task.id)
        return next
      })
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/doctor-tasks/${id}`)
      setTasks((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  const pendingTasks = tasks.filter((t) => !t.isCompleted)
  const completedTasks = tasks.filter((t) => t.isCompleted)

  const formatDue = (dateStr) => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(d)
    due.setHours(0, 0, 0, 0)
    const diff = Math.floor((due - today) / (1000 * 60 * 60 * 24))
    if (diff < 0) return { label: 'Overdue', color: 'text-red-600' }
    if (diff === 0) return { label: 'Today', color: 'text-amber-600' }
    if (diff === 1) return { label: 'Tomorrow', color: 'text-blue-600' }
    return {
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      color: 'text-slate-500',
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">My Tasks</CardTitle>
          {pendingTasks.length > 0 && (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              {pendingTasks.length} pending
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Add Task Form */}
        <form onSubmit={handleAdd} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a new task..."
              maxLength={255}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400"
              disabled={adding}
            />
            <button
              type="submit"
              disabled={adding || !newTitle.trim()}
              className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="text-xs px-2 py-1 border border-slate-200 rounded-md focus:ring-1 focus:ring-primary focus:border-transparent text-slate-600"
              disabled={adding}
            />
            {newDueDate && (
              <button
                type="button"
                onClick={() => setNewDueDate('')}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No tasks yet</p>
            <p className="text-xs mt-1">Add your first task above</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Pending Tasks */}
            {pendingTasks.map((task) => {
              const due = formatDue(task.dueDate)
              return (
                <div
                  key={task.id}
                  className="group flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <button
                    onClick={() => handleToggle(task)}
                    disabled={togglingIds.has(task.id)}
                    className="mt-0.5 flex-shrink-0 text-slate-300 hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {togglingIds.has(task.id)
                      ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                      : <Circle className="w-5 h-5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800">{task.title}</p>
                    {due && (
                      <p className={`text-xs mt-0.5 ${due.color}`}>
                        {due.label}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <>
                {pendingTasks.length > 0 && (
                  <div className="border-t border-slate-100 my-2" />
                )}
                <p className="text-xs font-medium text-slate-400 px-2 pt-1">
                  Completed ({completedTasks.length})
                </p>
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <button
                      onClick={() => handleToggle(task)}
                      disabled={togglingIds.has(task.id)}
                      className="mt-0.5 flex-shrink-0 text-green-500 hover:text-slate-400 transition-colors disabled:opacity-50"
                    >
                      {togglingIds.has(task.id)
                        ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                        : <CheckCircle2 className="w-5 h-5" />}
                    </button>
                    <p className="flex-1 min-w-0 text-sm text-slate-400 line-through">
                      {task.title}
                    </p>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
