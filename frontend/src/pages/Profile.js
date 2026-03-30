import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Card, PageHeader, Button, FormField, Input } from '../components/common/UI';
import { UserCircleIcon, KeyIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [nameEdit, setNameEdit] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [savingPw, setSavingPw] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const fd = new FormData();
      fd.append('name', nameEdit);
      await authAPI.updateProfile(fd);
      updateUser({ name: nameEdit });
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSavingProfile(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    setSavingPw(true);
    try {
      await authAPI.changePassword(pwForm);
      toast.success('Password changed. Please login again.');
      setTimeout(() => window.location.href = '/login', 1500);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setSavingPw(false); }
  };

  const ROLE_COLORS = { student: 'bg-blue-100 text-blue-700', teacher: 'bg-emerald-100 text-emerald-700', admin: 'bg-purple-100 text-purple-700' };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <PageHeader title="Profile" subtitle="Manage your account details" />
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-display font-bold text-lg text-surface-900">{user?.name}</p>
            <p className="text-sm text-surface-500">{user?.email}</p>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize inline-block mt-1 ${ROLE_COLORS[user?.role]}`}>{user?.role}</span>
          </div>
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <FormField label="Full Name"><Input value={nameEdit} onChange={(e) => setNameEdit(e.target.value)} /></FormField>
          <FormField label="Email"><Input value={user?.email} disabled className="opacity-60 cursor-not-allowed" /></FormField>
          {user?.studentId && <FormField label="Student ID"><Input value={user.studentId} disabled className="opacity-60 cursor-not-allowed" /></FormField>}
          <Button type="submit" loading={savingProfile} leftIcon={UserCircleIcon}>Save Profile</Button>
        </form>
      </Card>
      <Card>
        <h2 className="font-display font-semibold text-surface-900 mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <FormField label="Current Password"><Input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))} placeholder="Enter current password" /></FormField>
          <FormField label="New Password"><Input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))} placeholder="Min 8 chars, A-z, 0-9" /></FormField>
          <Button type="submit" loading={savingPw} variant="secondary" leftIcon={KeyIcon}>Update Password</Button>
        </form>
      </Card>
    </div>
  );
}
