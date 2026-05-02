import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      toast.success('Role updated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating role');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting user');
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-white text-2xl font-semibold">Team Members</h2>
          <p className="text-surface-200/50 text-sm mt-1">{users.length} member{users.length !== 1 ? 's' : ''}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="bg-surface-900 border border-white/5 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 px-6 py-3 border-b border-white/5 text-xs text-surface-200/40 font-medium uppercase tracking-wider">
              <div className="col-span-4">Member</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Joined</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            <div className="divide-y divide-white/5">
              {users.map(u => {
                const isCurrentUser = u._id === currentUser._id;
                const initials = u.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <div key={u._id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-white/2 transition-colors">
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-medium">{initials}</span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {u.name}
                          {isCurrentUser && <span className="ml-2 text-xs text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">You</span>}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <p className="text-surface-200/60 text-sm">{u.email}</p>
                    </div>
                    <div className="col-span-2">
                      {isCurrentUser ? (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${u.role === 'admin' ? 'bg-brand-500/20 text-brand-400' : 'bg-surface-700 text-surface-200'}`}>
                          {u.role}
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u._id, e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-brand-500"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </div>
                    <div className="col-span-2">
                      <p className="text-surface-200/40 text-sm">{format(new Date(u.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {!isCurrentUser && (
                        <button
                          onClick={() => handleDelete(u._id)}
                          className="p-1.5 text-surface-200/40 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete user"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Users;
