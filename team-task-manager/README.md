# TaskFlow — Team Task Manager

A production-ready full-stack MERN application for managing team projects and tasks with role-based access control.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Tailwind CSS + React Router |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT + bcrypt |
| State | Context API |
| HTTP | Axios |

## Features

### Authentication & Authorization
- JWT-based login/signup with bcrypt password hashing
- Role-based access: **Admin** and **Member**
- Protected routes on frontend and backend

### Admin Capabilities
- Create, edit, delete projects
- Add/remove project members
- Create, assign, and delete tasks
- View all users and manage their roles

### Member Capabilities  
- View projects they belong to
- View their assigned tasks
- Update task status (To Do → In Progress → Completed)

### Dashboard
- Task statistics: Total, Completed, Pending, Overdue
- Completion rate progress bar
- My pending tasks with due dates
- Recent task activity

### Task Management
- Filter by status, project, priority, assignee
- Priority levels: Low, Medium, High
- Due date tracking with overdue indicators

## Project Structure

```
team-task-manager/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Login, signup, getMe
│   │   ├── dashboardController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js               # JWT verify + role guards
│   │   ├── errorHandler.js       # Global error handling
│   │   └── validation.js         # express-validator rules
│   ├── models/
│   │   ├── User.js               # name, email, password, role
│   │   ├── Project.js            # title, description, members, createdBy
│   │   └── Task.js               # title, desc, projectId, assignedTo, status, dueDate
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   └── userRoutes.js
│   ├── server.js
│   └── .env.example
│
└── frontend/
    └── src/
        ├── components/
        │   ├── Layout.js          # Sidebar navigation
        │   └── ProtectedRoute.js  # Auth guard
        ├── context/
        │   └── AuthContext.js     # Global auth state
        ├── pages/
        │   ├── AuthPage.js        # Login + Signup
        │   ├── Dashboard.js       # Stats + overview
        │   ├── Projects.js        # Project management
        │   ├── Tasks.js           # Task management + filters
        │   └── Users.js           # User management (admin)
        ├── utils/
        │   └── api.js             # Axios instance + interceptors
        └── App.js                 # Routes
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
git clone <repo-url>
cd team-task-manager

# Install all dependencies
npm run install:all
# Or install separately:
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/team-task-manager
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRE=7d
NODE_ENV=development
```

### 3. Configure Frontend (optional)

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Run Development Servers

**Option A — Run together (from root):**
```bash
npm install        # installs concurrently
npm run dev        # starts both backend + frontend
```

**Option B — Run separately:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev        # starts on http://localhost:5000

# Terminal 2 - Frontend  
cd frontend
npm start          # starts on http://localhost:3000
```

### 5. Create Admin Account

Sign up with the app and select **Admin** role. Or update a user's role in MongoDB:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register user |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Private | Get current user |

### Projects
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects` | Private | List all (admin) / member's projects |
| POST | `/api/projects` | Admin | Create project |
| GET | `/api/projects/:id` | Private | Get project |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project + tasks |
| PUT | `/api/projects/:id/members` | Admin | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Admin | Remove member |

### Tasks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tasks` | Private | List tasks (filtered) |
| POST | `/api/tasks` | Admin | Create task |
| GET | `/api/tasks/:id` | Private | Get task |
| PUT | `/api/tasks/:id` | Private | Update (admin: all fields, member: status only) |
| DELETE | `/api/tasks/:id` | Admin | Delete task |
| GET | `/api/tasks/project/:id` | Private | Tasks by project |

### Users (Admin only)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/users` | Admin | List all users |
| GET | `/api/users/:id` | Admin | Get user |
| PUT | `/api/users/:id/role` | Admin | Update role |
| DELETE | `/api/users/:id` | Admin | Delete user |
| PUT | `/api/users/profile` | Private | Update own profile |

### Dashboard
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/dashboard` | Private | Stats + recent tasks |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Backend port (default: 5000) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing (min 32 chars) |
| `JWT_EXPIRE` | No | Token expiry (default: 7d) |
| `NODE_ENV` | No | development / production |
| `CLIENT_URL` | No | Frontend URL for CORS (default: http://localhost:3000) |

## Database Schema

```
User: { name, email, password (hashed), role: admin|member, timestamps }
Project: { title, description, members: [userId], createdBy: userId, status, timestamps }
Task: { title, description, projectId, assignedTo: userId, createdBy: userId, 
        status: todo|in-progress|completed, priority: low|medium|high, dueDate, timestamps }
```

## Production Deployment

1. Build frontend: `npm run build:frontend`
2. Serve built files via Express or a static host (Vercel, Netlify)
3. Deploy backend to Railway, Render, or any Node.js host
4. Set `MONGO_URI` to your Atlas cluster URI
5. Set `JWT_SECRET` to a strong random string
6. Set `NODE_ENV=production`
