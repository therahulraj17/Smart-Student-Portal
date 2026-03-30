# 🎓 Smart Student Portal

A **production-ready, full-stack educational platform** for students, teachers, and administrators. Built with React.js, Node.js, Express, MongoDB, Socket.io, and JWT authentication.

---

## ✨ Features

| Feature | Student | Teacher | Admin |
|---|---|---|---|
| Dashboard with stats & charts | ✅ | ✅ | ✅ |
| Assignment management | Submit | Create/Grade | View all |
| Quiz system (MCQ + timer) | Attempt | Create/View | View all |
| Attendance tracking | View % | Mark | View all |
| Study materials | Download | Upload | Manage |
| Real-time chat (Socket.io) | ✅ | ✅ | — |
| Notifications (real-time) | ✅ | ✅ | ✅ |
| Calendar planner | ✅ | ✅ | ✅ |
| Plagiarism checker | — | ✅ | — |
| Deadline reminders (cron) | ✅ | — | — |
| Admin panel (CRUD users) | — | — | ✅ |
| Password reset (email) | ✅ | ✅ | ✅ |

---

## 🏗️ Tech Stack

**Backend:** Node.js · Express.js · MongoDB (Mongoose) · Socket.io · JWT (access + refresh) · bcryptjs · Winston · node-cron · Nodemailer · Multer · Helmet · express-rate-limit

**Frontend:** React 18 · React Router 6 · Tailwind CSS · Chart.js · Socket.io-client · Axios · react-hot-toast · date-fns · Heroicons

---

## 📁 Project Structure

```
smart-student-portal/
├── backend/
│   ├── config/
│   │   ├── database.js       # MongoDB connection
│   │   └── socket.js         # Socket.io setup
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── assignmentController.js
│   │   ├── quizController.js
│   │   └── combinedControllers.js
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT protect + RBAC
│   │   ├── errorMiddleware.js # Centralized error handler
│   │   └── uploadMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Course.js
│   │   ├── Assignment.js
│   │   ├── Quiz.js
│   │   ├── Attendance.js
│   │   ├── Material.js
│   │   ├── Notification.js
│   │   ├── Message.js
│   │   └── CalendarEvent.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── assignmentRoutes.js
│   │   ├── quizRoutes.js
│   │   └── ... (10+ route files)
│   ├── utils/
│   │   ├── logger.js         # Winston logger
│   │   ├── jwtUtils.js       # Token helpers
│   │   ├── emailUtils.js     # Nodemailer templates
│   │   ├── plagiarismChecker.js
│   │   └── validators.js     # Joi schemas
│   ├── jobs/
│   │   └── cronJobs.js       # Deadline reminder cron
│   ├── scripts/
│   │   ├── seed.js           # Demo data seeder
│   │   └── SmartStudentPortal.postman_collection.json
│   ├── uploads/              # Local file storage
│   ├── logs/                 # Winston log files
│   ├── app.js                # Express app + middleware
│   ├── server.js             # HTTP server entry point
│   └── .env.example
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── common/
    │   │       ├── AppLayout.js   # Sidebar + topbar
    │   │       ├── LoadingScreen.js
    │   │       └── UI.js          # Reusable components
    │   ├── context/
    │   │   ├── AuthContext.js     # Global auth state
    │   │   └── SocketContext.js   # Socket.io state
    │   ├── pages/
    │   │   ├── Login.js / Register.js
    │   │   ├── Dashboard.js       # Role-based dashboard
    │   │   ├── Assignments.js / AssignmentDetail.js
    │   │   ├── Quizzes.js / QuizDetail.js / QuizAttempt.js
    │   │   ├── Attendance.js
    │   │   ├── Materials.js
    │   │   ├── Chat.js            # Real-time messaging
    │   │   ├── Calendar.js
    │   │   ├── Courses.js
    │   │   ├── AdminPanel.js
    │   │   └── Profile.js
    │   ├── services/
    │   │   └── api.js             # Axios instance + all API calls
    │   ├── App.js                 # Routes + providers
    │   └── index.js
    └── .env.example
```

---

## 🚀 Quick Setup

### Prerequisites
- Node.js >= 18
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com))
- npm or yarn

### Step 1 — Clone & Install

```bash
# Backend
cd smart-student-portal/backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2 — Environment Variables

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secrets, email config
nano .env

# Frontend
cd ../frontend
cp .env.example .env
# Edit if your backend runs on a different port
```

**Minimum required `.env` for backend:**
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/smart_student_portal
JWT_ACCESS_SECRET=changeme_min32chars_xxxxxxxxxxxxxxxx
JWT_REFRESH_SECRET=changeme_min32chars_yyyyyyyyyyyyyyyy
CLIENT_URL=http://localhost:3000
```

### Step 3 — Create Uploads & Logs Directories

```bash
cd backend
mkdir -p uploads/{avatars,assignments,submissions,materials} logs
```

### Step 4 — Seed Demo Data (Optional but Recommended)

```bash
cd backend
node scripts/seed.js
```

This creates:
- `admin@demo.com` / `Admin@123`
- `teacher@demo.com` / `Teacher@123`
- `student@demo.com` / `Student@123`
- `student2@demo.com` / `Student@123`
- 3 courses, 3 assignments, 1 quiz

### Step 5 — Start the App

```bash
# Terminal 1 — Backend
cd backend
npm run dev         # Development (nodemon)
# or
npm start           # Production

# Terminal 2 — Frontend
cd frontend
npm start
```

Open **http://localhost:3000** in your browser.

---

## 🔌 API Routes Reference

| Method | Route | Auth | Role |
|---|---|---|---|
| POST | `/api/auth/register` | — | — |
| POST | `/api/auth/login` | — | — |
| POST | `/api/auth/refresh` | Cookie | — |
| POST | `/api/auth/logout` | ✅ | Any |
| GET | `/api/auth/me` | ✅ | Any |
| PUT | `/api/auth/profile` | ✅ | Any |
| PUT | `/api/auth/change-password` | ✅ | Any |
| POST | `/api/auth/forgot-password` | — | — |
| PUT | `/api/auth/reset-password/:token` | — | — |
| GET | `/api/dashboard` | ✅ | Any |
| GET | `/api/assignments` | ✅ | Any |
| POST | `/api/assignments` | ✅ | Teacher/Admin |
| GET | `/api/assignments/:id` | ✅ | Any |
| PUT | `/api/assignments/:id` | ✅ | Teacher/Admin |
| DELETE | `/api/assignments/:id` | ✅ | Teacher/Admin |
| POST | `/api/assignments/:id/submit` | ✅ | Student |
| PUT | `/api/assignments/:id/submissions/:sid/grade` | ✅ | Teacher |
| POST | `/api/assignments/:id/submissions/:sid/plagiarism` | ✅ | Teacher |
| GET | `/api/quizzes` | ✅ | Any |
| POST | `/api/quizzes` | ✅ | Teacher/Admin |
| GET | `/api/quizzes/:id` | ✅ | Any |
| POST | `/api/quizzes/:id/attempt` | ✅ | Student |
| POST | `/api/quizzes/:id/attempt/:aid/submit` | ✅ | Student |
| POST | `/api/attendance` | ✅ | Teacher |
| GET | `/api/attendance/my` | ✅ | Student |
| GET | `/api/attendance/course/:courseId` | ✅ | Teacher/Admin |
| GET | `/api/courses` | ✅ | Any |
| POST | `/api/courses` | ✅ | Teacher/Admin |
| POST | `/api/courses/enroll` | ✅ | Student |
| GET | `/api/materials` | ✅ | Any |
| POST | `/api/materials` | ✅ | Teacher/Admin |
| DELETE | `/api/materials/:id` | ✅ | Teacher/Admin |
| GET | `/api/chat/users` | ✅ | Any |
| GET | `/api/chat/messages/:userId` | ✅ | Any |
| POST | `/api/chat/messages` | ✅ | Any |
| GET | `/api/notifications` | ✅ | Any |
| PUT | `/api/notifications/:id/read` | ✅ | Any |
| PUT | `/api/notifications/mark-all-read` | ✅ | Any |
| GET | `/api/calendar` | ✅ | Any |
| POST | `/api/calendar` | ✅ | Teacher/Admin |
| GET | `/api/admin/users` | ✅ | Admin |
| PUT | `/api/admin/users/:id` | ✅ | Admin |
| DELETE | `/api/admin/users/:id` | ✅ | Admin |
| GET | `/api/admin/reports` | ✅ | Admin |
| GET | `/api/health` | — | — |

---

## 🔒 Security Features

- **bcrypt** password hashing (salt rounds: 12)
- **JWT** with short-lived access tokens (15min) + rotating refresh tokens (7d)
- **HTTP-only cookies** for refresh tokens
- **Helmet.js** security headers
- **CORS** with explicit allowlist
- **Rate limiting** (100 req/15min global, 20 req/15min on auth)
- **express-mongo-sanitize** — NoSQL injection prevention
- **xss-clean** — XSS prevention
- **Joi** input validation on all routes
- **File upload validation** — MIME type + extension + size checks
- Refresh token **rotation** (old token invalidated on use)
- **Multi-device logout** (refresh token per device, max 5)

---

## 🧪 Testing with Postman

Import `backend/scripts/SmartStudentPortal.postman_collection.json` into Postman.

1. Run **Login** request — token auto-saves to collection variable
2. All other requests use `{{accessToken}}` automatically

---

## 🐛 Troubleshooting

| Issue | Fix |
|---|---|
| `MongoDB connection failed` | Check `MONGO_URI` in `.env`. Start `mongod` if using local. |
| `JWT_ACCESS_SECRET` error | Must be at least 32 characters |
| File upload fails | Run `mkdir -p backend/uploads/{avatars,assignments,submissions,materials}` |
| CORS error | Ensure `CLIENT_URL` in backend `.env` matches your frontend URL |
| Email not sending | Use Gmail with App Password, not your main password |
| Port already in use | Change `PORT` in backend `.env` or kill existing process |

---

## 📬 Email Setup (Gmail)

1. Enable 2FA on your Google account
2. Go to Google Account → Security → App Passwords
3. Create an app password for "Mail"
4. Use that 16-char password as `EMAIL_PASS` in `.env`

---

## 🏭 Production Deployment

```bash
# Backend
NODE_ENV=production npm start

# Frontend — build static files
npm run build
# Serve with nginx, serve, or any static host
```

For production: use **MongoDB Atlas**, **Redis** for session management (optional), a reverse proxy like **nginx**, and set `secure: true` for cookies.

---

## 📄 License

MIT — free for educational and commercial use.
