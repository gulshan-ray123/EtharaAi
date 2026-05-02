import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ProjectModal = ({ project, users, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: project?.title || '',
    description: project?.description || '',
    members: project?.members?.map(m => m._id) || []
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (project) {
        await api.put(`/projects/${project._id}`, form);
        toast.success('Project updated');
      } else {
        await api.post('/projects', form);
        toast.success('Project created');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-900 border border-white/10 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-white font-semibold">{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="text-surface-200/50 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-surface-200/70 mb-1.5">Project Title *</label>
            <input
              value={form.title}
              onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(er => ({ ...er, title: '' })); }}
              placeholder="e.g. Website Redesign"
              className={`w-full bg-white/5 border ${errors.title ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-500 transition-colors`}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm text-surface-200/70 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What is this project about?"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-500 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-sm text-surface-200/70 mb-1.5">Team Members</label>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
              {users.map(u => (
                <label key={u._id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded px-2 py-1">
                  <input
                    type="checkbox"
                    checked={form.members.includes(u._id)}
                    onChange={e => {
                      if (e.target.checked) setForm(f => ({ ...f, members: [...f.members, u._id] }));
                      else setForm(f => ({ ...f, members: f.members.filter(id => id !== u._id) }));
                    }}
                    className="accent-brand-500"
                  />
                  <span className="text-white text-sm">{u.name}</span>
                  <span className="text-surface-200/30 text-xs ml-auto capitalize">{u.role}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-lg text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {project ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const { isAdmin } = useAuth();

  const fetchData = async () => {
    try {
      const [projRes, usersRes] = await Promise.all([
        api.get('/projects'),
        isAdmin ? api.get('/users') : Promise.resolve({ data: { users: [] } })
      ]);
      setProjects(projRes.data.projects);
      setUsers(usersRes.data.users);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting project');
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-white text-2xl font-semibold">Projects</h2>
            <p className="text-surface-200/50 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setEditProject(null); setShowModal(true); }}
              className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Project
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-surface-200/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
            </div>
            <p className="text-surface-200/50 text-sm">No projects yet</p>
            {isAdmin && <button onClick={() => setShowModal(true)} className="mt-3 text-brand-400 text-sm hover:text-brand-300">Create your first project →</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map(project => {
              const progress = project.taskCount > 0 ? Math.round((project.completedCount / project.taskCount) * 100) : 0;
              return (
                <div key={project._id} className="bg-surface-900 border border-white/5 rounded-xl p-5 hover:border-brand-500/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 mr-3">
                      <h3 className="text-white font-medium truncate">{project.title}</h3>
                      {project.description && <p className="text-surface-200/50 text-xs mt-1 line-clamp-2">{project.description}</p>}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setEditProject(project); setShowModal(true); }}
                          className="p-1.5 text-surface-200/40 hover:text-white hover:bg-white/10 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(project._id)}
                          className="p-1.5 text-surface-200/40 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-surface-200/40 mb-1.5">
                      <span>{project.completedCount}/{project.taskCount} tasks</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <div className="bg-brand-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {/* Members */}
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {project.members?.slice(0, 4).map((m, i) => (
                        <div key={m._id} className="w-7 h-7 rounded-full bg-brand-700 border-2 border-surface-900 flex items-center justify-center" title={m.name}>
                          <span className="text-white text-xs font-medium">{m.name?.charAt(0).toUpperCase()}</span>
                        </div>
                      ))}
                      {project.members?.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-surface-700 border-2 border-surface-900 flex items-center justify-center">
                          <span className="text-surface-200 text-xs">+{project.members.length - 4}</span>
                        </div>
                      )}
                    </div>
                    <Link
                      to={`/tasks?project=${project._id}`}
                      className="text-brand-400 text-xs hover:text-brand-300 transition-colors"
                    >
                      View tasks →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showModal && (
          <ProjectModal
            project={editProject}
            users={users}
            onClose={() => { setShowModal(false); setEditProject(null); }}
            onSave={fetchData}
          />
        )}
      </div>
    </Layout>
  );
};

export default Projects;
