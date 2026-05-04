import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AIProvider } from './context/AIContext';
import LoadingScreen from './components/common/LoadingScreen';
import AppLayout from './components/common/AppLayout';

// Lazy-load pages for code splitting
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Assignments = lazy(() => import('./pages/Assignments'));
const AssignmentDetail = lazy(() => import('./pages/AssignmentDetail'));
const Quizzes = lazy(() => import('./pages/Quizzes'));
const QuizDetail = lazy(() => import('./pages/QuizDetail'));
const QuizAttempt = lazy(() => import('./pages/QuizAttempt'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Materials = lazy(() => import('./pages/Materials'));
const Chat = lazy(() => import('./pages/Chat'));
const Calendar = lazy(() => import('./pages/Calendar'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Courses = lazy(() => import('./pages/Courses'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

// ── Route Guards ─────────────────────────────────────────────────────────────
const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Suspense fallback={<LoadingScreen />}>
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />

      {/* Protected - inside AppLayout */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/assignments/:id" element={<AssignmentDetail />} />
        <Route path="/quizzes" element={<Quizzes />} />
        <Route path="/quizzes/:id" element={<QuizDetail />} />
        <Route path="/quizzes/:id/attempt" element={<PrivateRoute roles={['student']}><QuizAttempt /></PrivateRoute>} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminPanel /></PrivateRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AIProvider>
            <AppRoutes />
            <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontFamily: 'DM Sans, sans-serif' } }} />
          </AIProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
