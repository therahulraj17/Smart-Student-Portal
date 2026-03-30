import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  HomeIcon, ClipboardDocumentListIcon, QuestionMarkCircleIcon,
  CalendarDaysIcon, BookOpenIcon, ChatBubbleLeftRightIcon,
  UserGroupIcon, BellIcon, UserCircleIcon, ArrowRightOnRectangleIcon,
  Bars3Icon, XMarkIcon, ChartBarIcon, AcademicCapIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const NAV_ITEMS = {
  student: [
    { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { to: '/courses', label: 'My Courses', icon: AcademicCapIcon },
    { to: '/assignments', label: 'Assignments', icon: ClipboardDocumentListIcon },
    { to: '/quizzes', label: 'Quizzes', icon: QuestionMarkCircleIcon },
    { to: '/attendance', label: 'Attendance', icon: ChartBarIcon },
    { to: '/materials', label: 'Study Materials', icon: BookOpenIcon },
    { to: '/chat', label: 'Messages', icon: ChatBubbleLeftRightIcon },
    { to: '/calendar', label: 'Calendar', icon: CalendarDaysIcon },
  ],
  teacher: [
    { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { to: '/courses', label: 'My Courses', icon: AcademicCapIcon },
    { to: '/assignments', label: 'Assignments', icon: ClipboardDocumentListIcon },
    { to: '/quizzes', label: 'Quizzes', icon: QuestionMarkCircleIcon },
    { to: '/attendance', label: 'Attendance', icon: ChartBarIcon },
    { to: '/materials', label: 'Materials', icon: BookOpenIcon },
    { to: '/chat', label: 'Messages', icon: ChatBubbleLeftRightIcon },
    { to: '/calendar', label: 'Calendar', icon: CalendarDaysIcon },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { to: '/admin', label: 'Admin Panel', icon: UserGroupIcon },
    { to: '/courses', label: 'Courses', icon: AcademicCapIcon },
    { to: '/assignments', label: 'Assignments', icon: ClipboardDocumentListIcon },
    { to: '/quizzes', label: 'Quizzes', icon: QuestionMarkCircleIcon },
    { to: '/materials', label: 'Materials', icon: BookOpenIcon },
    { to: '/calendar', label: 'Calendar', icon: CalendarDaysIcon },
  ],
};

const ROLE_COLORS = { student: 'bg-blue-100 text-blue-700', teacher: 'bg-emerald-100 text-emerald-700', admin: 'bg-purple-100 text-purple-700' };

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { notifications } = useSocket() || {};
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unread = (notifications || []).filter((n) => !n.isRead).length;
  const navItems = NAV_ITEMS[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-200">
        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
          <AcademicCapIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-display font-bold text-sm text-surface-900 leading-tight">Smart Student</p>
          <p className="text-xs text-surface-400 font-medium">Portal</p>
        </div>
      </div>

      {/* User Card */}
      <div className="px-4 py-4 border-b border-surface-100">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50">
          <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-surface-900 truncate">{user?.name}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[user?.role]}`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-surface-100 space-y-1">
        <NavLink to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-600 hover:bg-surface-100 hover:text-surface-900 transition-all">
          <UserCircleIcon className="w-5 h-5" /> Profile
        </NavLink>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all">
          <ArrowRightOnRectangleIcon className="w-5 h-5" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-surface-200 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar - mobile */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-surface-200 transform transition-transform duration-200 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-surface-200 flex items-center px-4 lg:px-6 gap-4 flex-shrink-0">
          <button className="lg:hidden p-2 rounded-lg hover:bg-surface-100" onClick={() => setSidebarOpen(true)}>
            <Bars3Icon className="w-5 h-5 text-surface-600" />
          </button>

          <div className="flex-1" />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative p-2 rounded-xl hover:bg-surface-100 transition-colors"
            >
              <BellIcon className="w-5 h-5 text-surface-600" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-surface-200 z-50 overflow-hidden animate-slide-up">
                <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
                  <p className="font-semibold text-sm text-surface-900">Notifications</p>
                  <button onClick={() => setNotifOpen(false)}><XMarkIcon className="w-4 h-4 text-surface-400" /></button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-surface-50">
                  {(notifications || []).length === 0 ? (
                    <p className="text-center text-sm text-surface-400 py-8">No notifications yet</p>
                  ) : (
                    (notifications || []).slice(0, 10).map((n, i) => (
                      <div key={i} className={`px-4 py-3 ${!n.isRead ? 'bg-primary-50/50' : ''}`}>
                        <p className="text-sm font-medium text-surface-900">{n.title}</p>
                        <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
