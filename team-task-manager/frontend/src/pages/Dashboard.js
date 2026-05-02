import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, isAfter } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const StatCard = ({ label, value, color, icon }) => (
  <div className="bg-surface-900 border border-white/5 rounded-xl p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-surface-200/50 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.replace('text-', 'bg-').replace('-400', '-500/10').replace('-500', '-500/10')}`}>
        {icon}
      </div>
    </div>
  </div>
);

const statusConfig = {
  'todo': { label: 'To Do', cls: 'bg-surface-700 text-surface-200' },
  'in-progress': { label: 'In Progress', cls: 'bg-amber-500/20 text-amber-400' },
  'completed': { label: 'Done', cls: 'bg-emerald-500/20 text-emerald-400' },
};

const priorityConfig = {
  'low': 'text-sky-400',
  'medium': 'text-amber-400',
  'high': 'text-red-400',
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  const { stats, recentTasks, myTasks } = data || {};

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-white text-2xl font-semibold">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="text-surface-200/50 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Tasks" value={stats?.totalTasks || 0} color="text-brand-400" icon={
            <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          } />
          <StatCard label="Completed" value={stats?.completedTasks || 0} color="text-emerald-400" icon={
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          } />
          <StatCard label="Pending" value={stats?.pendingTasks || 0} color="text-amber-400" icon={
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          } />
          <StatCard label="Overdue" value={stats?.overdueTasks || 0} color="text-red-400" icon={
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          } />
        </div>

        {/* Progress bar */}
        <div className="bg-surface-900 border border-white/5 rounded-xl p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white text-sm font-medium">Overall Completion</span>
            <span className="text-brand-400 text-sm font-bold">{stats?.completionRate || 0}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-brand-600 to-brand-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats?.completionRate || 0}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Tasks */}
          <div className="bg-surface-900 border border-white/5 rounded-xl">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="text-white font-medium">My Pending Tasks</h3>
              <Link to="/tasks" className="text-brand-400 text-xs hover:text-brand-300 transition-colors">View all →</Link>
            </div>
            <div className="p-2 divide-y divide-white/5 max-h-80 overflow-y-auto">
              {myTasks?.length === 0 && (
                <div className="text-center py-8 text-surface-200/30 text-sm">No pending tasks 🎉</div>
              )}
              {myTasks?.map(task => {
                const overdue = isAfter(new Date(), new Date(task.dueDate)) && task.status !== 'completed';
                return (
                  <div key={task._id} className="flex items-start gap-3 p-3 hover:bg-white/3 rounded-lg transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priorityConfig[task.priority]?.replace('text-', 'bg-')}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{task.title}</p>
                      <p className="text-surface-200/40 text-xs mt-0.5">{task.projectId?.title}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[task.status]?.cls}`}>
                        {statusConfig[task.status]?.label}
                      </span>
                      <span className={`text-xs ${overdue ? 'text-red-400' : 'text-surface-200/30'}`}>
                        {format(new Date(task.dueDate), 'MMM d')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-surface-900 border border-white/5 rounded-xl">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="text-white font-medium">Recent Tasks</h3>
              {isAdmin && <Link to="/tasks" className="text-brand-400 text-xs hover:text-brand-300 transition-colors">Manage →</Link>}
            </div>
            <div className="p-2 divide-y divide-white/5 max-h-80 overflow-y-auto">
              {recentTasks?.length === 0 && (
                <div className="text-center py-8 text-surface-200/30 text-sm">No tasks yet</div>
              )}
              {recentTasks?.map(task => (
                <div key={task._id} className="flex items-start gap-3 p-3 hover:bg-white/3 rounded-lg transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{task.title}</p>
                    <p className="text-surface-200/40 text-xs mt-0.5">
                      {task.projectId?.title} · Assigned to {task.assignedTo?.name}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusConfig[task.status]?.cls}`}>
                    {statusConfig[task.status]?.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
