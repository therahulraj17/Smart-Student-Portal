import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import { Card, StatCard, PageHeader, Badge, ProgressBar, Spinner } from '../components/common/UI';
import {
  ClipboardDocumentListIcon, QuestionMarkCircleIcon, AcademicCapIcon,
  BellIcon, ChartBarIcon, UserGroupIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { format, formatDistanceToNow } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

const STATUS_COLOR = { submitted: 'blue', graded: 'green', late: 'red', pending: 'yellow' };

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get()
      .then((r) => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  );

  if (!data) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title={`Good ${getGreeting()}, ${user?.name?.split(' ')[0]} 👋`}
        subtitle={`${format(new Date(), 'EEEE, MMMM d, yyyy')} • ${user?.role}`}
      />

      {/* ── STUDENT DASHBOARD ── */}
      {user?.role === 'student' && <StudentDashboard data={data} />}

      {/* ── TEACHER DASHBOARD ── */}
      {user?.role === 'teacher' && <TeacherDashboard data={data} />}

      {/* ── ADMIN DASHBOARD ── */}
      {user?.role === 'admin' && <AdminDashboard data={data} />}
    </div>
  );
}

// ── Student Dashboard ─────────────────────────────────────────────────────────
function StudentDashboard({ data }) {
  const { stats, upcomingAssignments = [], notifications = [] } = data;

  const completionData = {
    labels: ['Completed', 'Pending'],
    datasets: [{
      data: [stats.completionRate, 100 - stats.completionRate],
      backgroundColor: ['#4f46e5', '#e2e8f0'],
      borderWidth: 0,
    }],
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Enrolled Courses" value={stats.enrolledCourses} icon={AcademicCapIcon} color="primary" />
        <StatCard label="Completion Rate" value={`${stats.completionRate}%`} icon={CheckCircleIcon} color="green" />
        <StatCard label="Attendance" value={`${stats.attendanceRate}%`} icon={ChartBarIcon} color="amber" />
        <StatCard label="Notifications" value={stats.unreadNotifications} icon={BellIcon} color="purple" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Assignments */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-surface-900">Upcoming Assignments</h2>
              <Link to="/assignments" className="text-xs font-medium text-primary-600 hover:text-primary-700">View all →</Link>
            </div>
            {upcomingAssignments.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardDocumentListIcon className="w-10 h-10 text-surface-300 mx-auto mb-2" />
                <p className="text-sm text-surface-400">No upcoming assignments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map((a) => (
                  <Link key={a._id} to={`/assignments/${a._id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-50 transition-colors border border-surface-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ClipboardDocumentListIcon className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-surface-900 truncate">{a.title}</p>
                        <p className="text-xs text-surface-400">{a.courseId?.name}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs font-medium text-surface-700">{format(new Date(a.dueDate), 'MMM d')}</p>
                      <p className="text-xs text-surface-400">{formatDistanceToNow(new Date(a.dueDate), { addSuffix: true })}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Productivity Chart */}
        <div className="space-y-4">
          <Card>
            <h2 className="font-display font-semibold text-surface-900 mb-4">Productivity</h2>
            <div className="w-40 mx-auto">
              <Doughnut data={completionData} options={{ cutout: '70%', plugins: { legend: { display: false } } }} />
            </div>
            <div className="text-center mt-3">
              <p className="text-2xl font-display font-bold text-surface-900">{stats.completionRate}%</p>
              <p className="text-xs text-surface-500">Assignment completion</p>
            </div>
          </Card>

          <Card>
            <h2 className="font-display font-semibold text-surface-900 mb-3">Attendance</h2>
            <ProgressBar value={stats.attendanceRate} color={stats.attendanceRate >= 75 ? 'green' : stats.attendanceRate >= 50 ? 'amber' : 'red'} />
            <p className="text-xs text-surface-400 mt-2">
              {stats.attendanceRate >= 75 ? '✅ Good attendance' : stats.attendanceRate >= 50 ? '⚠️ Needs improvement' : '❌ Critical — below 50%'}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Teacher Dashboard ─────────────────────────────────────────────────────────
function TeacherDashboard({ data }) {
  const { stats, recentAssignments = [] } = data;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Teaching Courses" value={stats.teachingCourses} icon={AcademicCapIcon} color="primary" />
        <StatCard label="Total Students" value={stats.totalStudents} icon={UserGroupIcon} color="green" />
        <StatCard label="Pending Grading" value={stats.pendingGrading} icon={ClipboardDocumentListIcon} color="amber" sub="submissions awaiting review" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-surface-900">Recent Assignments</h2>
          <Link to="/assignments" className="text-xs font-medium text-primary-600">View all →</Link>
        </div>
        {recentAssignments.length === 0 ? (
          <p className="text-center text-sm text-surface-400 py-8">No assignments yet</p>
        ) : (
          <div className="divide-y divide-surface-100">
            {recentAssignments.map((a) => (
              <Link key={a._id} to={`/assignments/${a._id}`}
                className="flex items-center justify-between py-3 hover:bg-surface-50 px-2 rounded-lg transition-colors">
                <div>
                  <p className="text-sm font-medium text-surface-900">{a.title}</p>
                  <p className="text-xs text-surface-400">{a.courseId?.name} • Due {format(new Date(a.dueDate), 'MMM d, yyyy')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-surface-700">{a.submissionCount || 0}</p>
                  <p className="text-xs text-surface-400">submissions</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────
function AdminDashboard({ data }) {
  const { stats } = data;
  const usersByRole = stats.usersByRole || [];
  const roleMap = Object.fromEntries(usersByRole.map((r) => [r._id, r.count]));

  const chartData = {
    labels: ['Students', 'Teachers', 'Admins'],
    datasets: [{
      label: 'Users',
      data: [roleMap.student || 0, roleMap.teacher || 0, roleMap.admin || 0],
      backgroundColor: ['#6366f1', '#10b981', '#f59e0b'],
      borderRadius: 6,
    }],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers} icon={UserGroupIcon} color="primary" />
        <StatCard label="Courses" value={stats.totalCourses} icon={AcademicCapIcon} color="green" />
        <StatCard label="Assignments" value={stats.totalAssignments} icon={ClipboardDocumentListIcon} color="amber" />
        <StatCard label="Quizzes" value={stats.totalQuizzes} icon={QuestionMarkCircleIcon} color="purple" />
      </div>

      <Card>
        <h2 className="font-display font-semibold text-surface-900 mb-4">Users by Role</h2>
        <div className="h-48">
          <Bar data={chartData} options={{
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } },
          }} />
        </div>
      </Card>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
