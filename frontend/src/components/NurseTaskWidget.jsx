import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Circle, CheckCircle2, Calendar as CalendarIcon, Loader2, ClipboardList } from 'lucide-react';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

export default function NurseTaskWidget() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [adding, setAdding] = useState(false);
  const [togglingIds, setTogglingIds] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);

  const fetchTasks = useCallback(() => {
    api.get('/nurse-tasks')
      .then((res) => setTasks(res.data || []))
      .catch((err) => {
        if (err.status !== 404 && err.status !== 403) console.error(err);
        setTasks([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    setErrorStatus(null);
    try {
      const res = await api.post('/nurse-tasks', {
        title: newTitle.trim(),
        dueDate: newDueDate || null,
      });
      setTasks((prev) => [res.data, ...prev]);
      setNewTitle('');
      setNewDueDate('');
    } catch (err) {
      console.error('Failed to add task:', err);
      setErrorStatus('Failed to add task. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (task) => {
    // Optimistic Update
    const originalStatus = task.isCompleted;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, isCompleted: !originalStatus } : t)));
    setTogglingIds((prev) => new Set(prev).add(task.id));
    setErrorStatus(null);

    try {
      const res = await api.patch(`/nurse-tasks/${task.id}`, {
        isCompleted: !originalStatus,
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? res.data : t)));
    } catch (err) {
      console.error('Failed to toggle task:', err);
      setErrorStatus('Failed to update task status.');
      // Rollback
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, isCompleted: originalStatus } : t)));
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

  const handleStartEdit = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDueDate('');
  };

  const handleSaveEdit = async (id) => {
    if (!editTitle.trim()) return;
    setSaving(true);
    setErrorStatus(null);
    try {
      const res = await api.patch(`/nurse-tasks/${id}`, {
        title: editTitle.trim(),
        dueDate: editDueDate || null,
      });
      setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
      handleCancelEdit();
    } catch (err) {
      console.error('Failed to update task:', err);
      setErrorStatus('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setErrorStatus(null);
    try {
      await api.delete(`/nurse-tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Failed to delete task:', err);
      setErrorStatus('Failed to delete task.');
    }
  };

  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);

  const formatDue = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(d);
    due.setHours(0, 0, 0, 0);
    const diff = Math.floor((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: 'Overdue', color: 'text-red-600' };
    if (diff === 0) return { label: 'Today', color: 'text-amber-600' };
    if (diff === 1) return { label: 'Tomorrow', color: 'text-blue-600' };
    return {
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      color: 'text-slate-500',
    };
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Daily Tasks</CardTitle>
              <CardDescription>Assigned & Today's Checklist</CardDescription>
            </div>
          </div>
          {pendingTasks.length > 0 && (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              {pendingTasks.length} pending
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {errorStatus && (
          <div className="mb-4 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-600 flex items-center justify-between">
            <span>{errorStatus}</span>
            <button onClick={() => setErrorStatus(null)} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}
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
              const due = formatDue(task.dueDate);
              return (
                <div
                  key={task.id}
                  className="group flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(task)}
                    disabled={togglingIds.has(task.id)}
                    className="mt-0.5 flex-shrink-0 text-slate-300 hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {togglingIds.has(task.id)
                      ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                      : <Circle className="w-5 h-5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    {editingId === task.id ? (
                      <div className="space-y-2 py-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                          autoFocus
                          disabled={saving}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="text-xs px-1.5 py-0.5 border border-slate-200 rounded text-slate-600 focus:ring-1 focus:ring-primary focus:border-transparent"
                            disabled={saving}
                          />
                          <div className="flex-1" />
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50"
                            disabled={saving}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(task.id)}
                            className="text-xs font-bold text-primary hover:text-primary/80 disabled:opacity-50 flex items-center gap-1"
                            disabled={saving || !editTitle.trim()}
                          >
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="cursor-pointer" onClick={() => handleStartEdit(task)}>
                        <p className="text-sm text-slate-800">{task.title}</p>
                        {due && (
                          <p className={`text-xs mt-0.5 ${due.color}`}>
                            {due.label}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
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
                      type="button"
                      onClick={() => handleToggle(task)}
                      disabled={togglingIds.has(task.id)}
                      className="mt-0.5 flex-shrink-0 text-green-500 hover:text-slate-400 transition-colors disabled:opacity-50"
                    >
                      {togglingIds.has(task.id)
                        ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                        : <CheckCircle2 className="w-5 h-5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      {editingId === task.id ? (
                        <div className="space-y-2 py-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                            autoFocus
                            disabled={saving}
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={editDueDate}
                              onChange={(e) => setEditDueDate(e.target.value)}
                              className="text-xs px-1.5 py-0.5 border border-slate-200 rounded text-slate-600 focus:ring-1 focus:ring-primary focus:border-transparent"
                              disabled={saving}
                            />
                            <div className="flex-1" />
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50"
                              disabled={saving}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(task.id)}
                              className="text-xs font-bold text-primary hover:text-primary/80 disabled:opacity-50 flex items-center gap-1"
                              disabled={saving || !editTitle.trim()}
                            >
                              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p
                          className="text-sm text-slate-400 line-through cursor-pointer"
                          onClick={() => handleStartEdit(task)}
                        >
                          {task.title}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
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
  );
}
