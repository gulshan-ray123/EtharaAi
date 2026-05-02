import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, isAfter, parseISO } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  'todo': { label: 'To Do', cls: 'bg-surface-700 text-surface-200', dot: 'bg-slate-400' },
  'in-progress': { label: 'In Progress', cls: 'bg-amber-500/20 text-amber-400', dot: 'bg-amber-400' },
  'completed': { label: 'Completed', cls: 'bg-emerald-500/20 text-emerald-400', dot: 'bg-emerald-400' },
};
const PRIORITY_CONFIG = {
  'low': { label: 'Low', cls: 'text-sky-400', border: 'border-l-sky-500' },
  'medium': { label: 'Medium', cls: 'text-amber-400', border: 'border-l-amber-500' },
  'high': { label: 'High', cls: 'text-red-400', border: 'border-l-red-500' },
};

const TaskModal = ({ task, projects, users, onClose, onSave, isAdmin }) => {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    projectId: task?.projectId?._id || task?.projectId || '',
    assignedTo: task?.assignedTo?._id || task?.assignedTo || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [projectMembers, setProjectMembers] = useState([]);

  useEffect(() => {
    if (form.projectId) {
      const proj = projects.find(p => p._id === form.projectId);
      setProjectMembers(proj?.members || []);
    }
  }, [form.projectId, projects]);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title required';
    if (!form.projectId) errs.projectId = 'Project required';
    if (!form.assignedTo) errs.assignedTo = 'Assignee required';
    if (!form.dueDate) errs.dueDate = 'Due date required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      // Members can only update status
      try {
        setLoading(true);
        await api.put(`/tasks/${task._id}`, { status: form.status });
        toast.success('Task updated');
        onSave(); onClose();
      } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
      finally { setLoading(false); }
      return;
    }
    if (!validate()) return;
    setLoading(true);
    try {
      if (task) { await api.put(`/tasks/${task._id}`, form); toast.success('Task updated'); }
      else { await api.post('/tasks', form); toast.success('Task created'); }
      onSave(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving task'); }
    finally { setLoading(false); }
  };

  const InputCls = (field) => `w-full bg-white/5 border ${errors[field] ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-surface-900">
          <h2 className="text-white font-semibold">{task ? (isAdmin ? 'Edit Task' : 'Update Status') : 'New Task'}</h2>
          <button onClick={onClose} className="text-surface-200/50 hover:text-white"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isAdmin && (
            <>
              <div>
                <label className="block text-sm text-surface-200/70 mb-1.5">Title *</label>
                <input value={form.title} onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(er => ({ ...er, title: '' })); }} placeholder="Task title" className={InputCls('title')} />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm text-surface-200/70 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="What needs to be done?" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-surface-200/70 mb-1.5">Project *</label>
                  <select value={form.projectId} onChange={e => { setForm(f => ({ ...f, projectId: e.target.value, assignedTo: '' })); setErrors(er => ({ ...er, projectId: '' })); }} className={InputCls('projectId')}>
                    <option value="">Select project</option>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                  </select>
                  {errors.projectId && <p className="text-red-400 text-xs mt-1">{errors.projectId}</p>}
                </div>
                <div>
                  <label className="block text-sm text-surface-200/70 mb-1.5">Assigned To *</label>
                  <select value={form.assignedTo} onChange={e => { setForm(f => ({ ...f, assignedTo: e.target.value })); setErrors(er => ({ ...er, assignedTo: '' })); }} className={InputCls('assignedTo')} disabled={!form.projectId}>
                    <option value="">Select member</option>
                    {projectMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                  {errors.assignedTo && <p className="text-red-400 text-xs mt-1">{errors.assignedTo}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-surface-200/70 mb-1.5">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className={InputCls('priority')}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-surface-200/70 mb-1.5">Due Date *</label>
                  <input type="date" value={form.dueDate} onChange={e => { setForm(f => ({ ...f, dueDate: e.target.value })); setErrors(er => ({ ...er, dueDate: '' })); }} className={InputCls('dueDate')} />
                  {errors.dueDate && <p className="text-red-400 text-xs mt-1">{errors.dueDate}</p>}
                </div>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm text-surface-200/70 mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={InputCls('status')}>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-lg text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {task ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useAuth();

  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    project: searchParams.get('project') || '',
    assignedTo: '',
    priority: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.project) params.projectId = filters.project;
      if (filters.assignedTo) params.assignedTo = filters.assignedTo;
      if (filters.priority) params.priority = filters.priority;

      const [tasksRes, projRes] = await Promise.all([
        api.get('/tasks', { params }),
        api.get('/projects')
      ]);
      setTasks(tasksRes.data.tasks);
      setProjects(projRes.data.projects);
      if (isAdmin) {
        const usersRes = await api.get('/users');
        setUsers(usersRes.data.users);
      }
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters, isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Task deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting task');
    }
  };

  const updateFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white text-2xl font-semibold">Tasks</h2>
            <p className="text-surface-200/50 text-sm mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
          </div>
          {isAdmin && (
            <button onClick={() => { setEditTask(null); setShowModal(true); }} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Task
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-surface-900 border border-white/5 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <select value={filters.status} onChange={e => updateFilter('status', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500">
              <option value="">All Status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select value={filters.project} onChange={e => updateFilter('project', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500">
              <option value="">All Projects</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
            <select value={filters.priority} onChange={e => updateFilter('priority', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500">
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            {isAdmin && (
              <select value={filters.assignedTo} onChange={e => updateFilter('assignedTo', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500">
                <option value="">All Members</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            )}
            {(filters.status || filters.project || filters.priority || filters.assignedTo) && (
              <button onClick={() => setFilters({ status: '', project: '', assignedTo: '', priority: '' })} className="text-surface-200/50 hover:text-white text-sm transition-colors px-2">Clear ×</button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-surface-200/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <p className="text-surface-200/50 text-sm">No tasks found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => {
              const overdue = task.status !== 'completed' && isAfter(new Date(), new Date(task.dueDate));
              const sc = STATUS_CONFIG[task.status];
              const pc = PRIORITY_CONFIG[task.priority];
              return (
                <div key={task._id} className={`bg-surface-900 border border-white/5 border-l-4 ${pc.border} rounded-xl p-4 hover:border-white/10 transition-all`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${sc.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium">{task.title}</p>
                          {task.description && <p className="text-surface-200/40 text-sm mt-0.5 line-clamp-1">{task.description}</p>}
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className="text-surface-200/40 text-xs">📁 {task.projectId?.title}</span>
                            <span className="text-surface-200/40 text-xs">👤 {task.assignedTo?.name}</span>
                            <span className={`text-xs font-medium ${pc.cls}`}>⚡ {pc.label}</span>
                            <span className={`text-xs ${overdue ? 'text-red-400 font-medium' : 'text-surface-200/40'}`}>
                              📅 {overdue ? '⚠ Overdue · ' : ''}{format(new Date(task.dueDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.cls}`}>{sc.label}</span>
                          <button
                            onClick={() => { setEditTask(task); setShowModal(true); }}
                            className="p-1.5 text-surface-200/40 hover:text-white hover:bg-white/10 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          {isAdmin && (
                            <button onClick={() => handleDelete(task._id)} className="p-1.5 text-surface-200/40 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showModal && (
          <TaskModal
            task={editTask}
            projects={projects}
            users={users}
            isAdmin={isAdmin}
            onClose={() => { setShowModal(false); setEditTask(null); }}
            onSave={fetchData}
          />
        )}
      </div>
    </Layout>
  );
};

export default Tasks;
