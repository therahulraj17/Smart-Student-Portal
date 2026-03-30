import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import { Card, PageHeader, Badge, Button, Input, Spinner } from '../components/common/UI';
import { UserGroupIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ROLE_COLORS = { student: 'blue', teacher: 'green', admin: 'purple' };

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminAPI.getUsers({ search, role: roleFilter, page, limit: 15 });
      setUsers(r.data.data.users);
      setTotalPages(r.data.data.pages);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, roleFilter, page]);

  const toggleActive = async (user) => {
    try {
      await adminAPI.updateUser(user._id, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch { toast.error('Failed to update user'); }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success('User deleted');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Admin Panel" subtitle="Manage users, courses, and platform settings" />
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-surface-900">Users</h2>
          <div className="flex gap-2">
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search users..." className="w-48" />
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-surface-200 rounded-xl bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100">
                    {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-surface-500 pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-surface-50 transition-colors">
                      <td className="py-3 pr-4"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600">{u.name.charAt(0)}</div><span className="font-medium text-surface-900">{u.name}</span></div></td>
                      <td className="py-3 pr-4 text-surface-500">{u.email}</td>
                      <td className="py-3 pr-4"><Badge color={ROLE_COLORS[u.role]}>{u.role}</Badge></td>
                      <td className="py-3 pr-4"><Badge color={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Inactive'}</Badge></td>
                      <td className="py-3 pr-4 text-surface-400 text-xs">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => toggleActive(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</Button>
                          {u.role !== 'admin' && <Button size="sm" variant="ghost" onClick={() => deleteUser(u._id, u.name)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4" /></Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-100">
                <p className="text-xs text-surface-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
