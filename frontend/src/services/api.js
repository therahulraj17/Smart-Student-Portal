import axios from 'axios';

const DEFAULT_API_URL = 'https://smart-student-portal-6og7.onrender.com/api';
const isLocalHost = typeof window !== 'undefined'
  && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

const API_URL = process.env.REACT_APP_API_URL || (isLocalHost ? 'http://localhost:5000/api' : DEFAULT_API_URL);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach access token ───────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 → refresh token ──────────
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => refreshSubscribers.push(cb);
const onRefreshed = (token) => { refreshSubscribers.forEach((cb) => cb(token)); refreshSubscribers = []; };

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        onRefreshed(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
};

// ── Dashboard ──────────────────────────────────────────────────────
export const dashboardAPI = { get: () => api.get('/dashboard') };

// ── Assignments ────────────────────────────────────────────────────
export const assignmentAPI = {
  getAll: (params) => api.get('/assignments', { params }),
  getById: (id) => api.get(`/assignments/${id}`),
  create: (data) => api.post('/assignments', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  delete: (id) => api.delete(`/assignments/${id}`),
  submit: (id, data) => api.post(`/assignments/${id}/submit`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  grade: (id, subId, data) => api.put(`/assignments/${id}/submissions/${subId}/grade`, data),
  checkPlagiarism: (id, subId) => api.post(`/assignments/${id}/submissions/${subId}/plagiarism`),
};

// ── Quizzes ────────────────────────────────────────────────────────
export const quizAPI = {
  getAll: (params) => api.get('/quizzes', { params }),
  getById: (id) => api.get(`/quizzes/${id}`),
  create: (data) => api.post('/quizzes', data),
  update: (id, data) => api.put(`/quizzes/${id}`, data),
  delete: (id) => api.delete(`/quizzes/${id}`),
  startAttempt: (id) => api.post(`/quizzes/${id}/attempt`),
  submitAttempt: (id, attemptId, data) => api.post(`/quizzes/${id}/attempt/${attemptId}/submit`, data),
};

// ── Attendance ─────────────────────────────────────────────────────
export const attendanceAPI = {
  mark: (data) => api.post('/attendance', data),
  getCourse: (courseId, params) => api.get(`/attendance/course/${courseId}`, { params }),
  getMy: (params) => api.get('/attendance/my', { params }),
};

// ── Materials ──────────────────────────────────────────────────────
export const materialAPI = {
  getAll: (params) => api.get('/materials', { params }),
  upload: (data) => api.post('/materials', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/materials/${id}`),
};

// ── Notifications ──────────────────────────────────────────────────
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
};

// ── Chat ───────────────────────────────────────────────────────────
export const chatAPI = {
  getUsers: () => api.get('/chat/users'),
  getMessages: (userId, params) => api.get(`/chat/messages/${userId}`, { params }),
  sendMessage: (data) => api.post('/chat/messages', data),
};

// ── Courses ────────────────────────────────────────────────────────
export const courseAPI = {
  getAll: () => api.get('/courses'),
  create: (data) => api.post('/courses', data),
  enroll: (courseId) => api.post('/courses/enroll', { courseId }),
};

// ── Admin ──────────────────────────────────────────────────────────
export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getReports: () => api.get('/admin/reports'),
};

// ── Calendar ───────────────────────────────────────────────────────
export const calendarAPI = {
  getEvents: (params) => api.get('/calendar', { params }),
  createEvent: (data) => api.post('/calendar', data),
};

export default api;
