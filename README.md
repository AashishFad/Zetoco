# FlowSync

> **Project & Team Collaboration Platform**  
> *Where teams and workflows stay in sync.*

---

## 📌 Purpose

**FlowSync** is a full-stack project and team collaboration platform inspired by modern workflow and communication tools such as Jira, Trello, and Slack. 

This project is engineered as a **portfolio and recruiter demonstration project** to showcase practical, production-minded full-stack development skills—including modular architectural design, clean REST API development, relational database integration, and intuitive frontend application engineering.

---

## 🛠️ Technology Stack

### Implemented (Phase 1)

#### Frontend
- **React (v18+)** — Declarative component-based user interface (JavaScript)
- **Vite** — Next-generation fast build tool and development server
- **Tailwind CSS** — Modern utility-first styling for a clean SaaS aesthetic
- **React Router (v6+)** — Client-side declarative routing and layout management
- **Axios** — Centralized HTTP client with unified error handling and request interception
- **Lucide React** — Consistent and lightweight UI iconography

#### Backend
- **Node.js** — Asynchronous event-driven runtime environment
- **Express.js** — Fast, unopinionated REST API framework
- **CORS & JSON Middleware** — Cross-origin resource sharing and body parsing
- **Centralized Error & 404 Handlers** — Standardized error handling and status responses

#### Database
- **PostgreSQL** — Relational database management system
- **`pg` (node-postgres)** — Centralized connection pool management with health check integration

---

### Planned Future Technologies (Not Yet Implemented)

The following technologies are scheduled for subsequent development phases:
- **Socket.IO** — Real-time bidirectional event-based communication for instant messaging and live board updates
- **Redis** — High-performance in-memory cache and pub/sub message broker
- **Cloud/Object Storage** — Secure file and asset storage
- **Automated Testing Suite** — Unit, integration, and end-to-end test suites (Jest, Supertest, React Testing Library)
- **Containerization & Deployment** — Docker containerization and cloud hosting workflows

---

## 🚀 Current Phase

### **Phase 3 — Authentication & User Identity with Supabase (Completed)**

Phase 3 implements a clean, secure authentication system using **Supabase Auth**:
1. **Managed Authentication Architecture**: Integrated official `@supabase/supabase-js` SDK with Email + Password authentication, delegating secure password hashing and token lifecycle management to Supabase.
2. **Centralized Auth Context & Listener**: `AuthProvider` and `useAuth` hook managing `user`, `session`, `loading`, and auto-updating via `supabase.auth.onAuthStateChange`.
3. **Route Guards & Protection**:
   - `ProtectedRoute`: Guards `/dashboard`, `/projects`, `/tasks`, `/team`, `/messages`, `/notifications`, `/files`, `/analytics`, `/settings`, and `/profile`.
   - `PublicOnlyRoute`: Automatically redirects authenticated users away from `/login` and `/register` to `/dashboard`.
   - Smooth non-flashing loading state during session re-hydration.
4. **Enhanced Auth Views**:
   - `LoginPage`: Supabase `signInWithPassword` integration, password visibility toggle, field validations, and error toasts.
   - `RegisterPage`: Supabase `signUp` with `full_name` metadata, password match checks, and handling for both instant-login and email-confirmation project configurations.
5. **Dynamic User State**: Shell header and profile page seamlessly render authenticated user identity (`user_metadata.full_name`, `email`, and initials).
6. **Backend Token Verification Preparation**: Express `authMiddleware` verifying incoming Supabase JWT tokens via `supabase.auth.getUser(token)` without trusting spoofed client body parameters.
7. **Zero Custom Password Storage**: Strict adherence to security best practices—no custom bcrypt, no plain password storage in application tables, and no exposed service-role keys.

---

## 🗺️ Future Modules Roadmap

The following modules will be built progressively in upcoming phases:
- 🔐 **Authentication & Session Management** (JWT, secure cookies, bcrypt password hashing)
- 🏢 **Multi-Tenant Organizations & Workspaces**
- 🛡️ **Role-Based Access Control (RBAC)** (Admin, Manager, Member, Guest)
- 📁 **Project Management** (Custom workflows, sprints, project templates)
- ✅ **Task Management & Custom Fields** (Priorities, deadlines, assignees, labels)
- 📋 **Interactive Kanban Board** (Drag-and-drop state transitions, column limits)
- 💬 **Threaded Comments & Activity Feeds**
- 👥 **Team Collaboration & Direct/Channel Messaging**
- ⚡ **Real-Time Updates via WebSockets**
- 🔔 **In-App & Email Notification Dispatcher**
- 📎 **File Attachments & Asset Management**
- 📊 **Project Analytics & Velocity Metrics**
- 🧪 **Comprehensive Automated Testing**
- 🚢 **Production Deployment & CI/CD Pipelines**

---

## 📁 Project Structure

```text
FlowSync/
├── client/                      # Frontend Application (React + Vite)
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── assets/              # Icons, images, branding assets
│   │   ├── components/          # Reusable UI components
│   │   │   └── common/          # Navbar, Footer, Status Badges
│   │   ├── constants/           # Navigation, branding & config constants
│   │   ├── hooks/               # Custom React hooks
│   │   ├── layouts/             # MainLayout, DashboardLayout
│   │   ├── pages/               # LandingPage, LoginPage, RegisterPage, DashboardPage, NotFoundPage
│   │   ├── services/            # Centralized Axios API client & endpoints
│   │   ├── utils/               # Helper utilities and formatters
│   │   ├── App.jsx              # Application router and shell
│   │   ├── index.css            # Tailwind directives and base typography
│   │   └── main.jsx             # React DOM root entrypoint
│   ├── .env.example             # Frontend environment template
│   ├── package.json             # Frontend dependencies and scripts
│   ├── postcss.config.js        # PostCSS configuration
│   ├── tailwind.config.js       # Tailwind CSS design system configuration
│   └── vite.config.js           # Vite build configuration
│
├── server/                      # Backend REST API (Node.js + Express)
│   ├── src/
│   │   ├── config/              # Centralized environment & PostgreSQL pool config
│   │   ├── controllers/         # Request handlers (Health, etc.)
│   │   ├── middleware/          # Centralized error & 404 handlers
│   │   ├── models/              # Database models and query definitions (Phase 2+)
│   │   ├── routes/              # Modular route definitions (/api/health, /api/auth, etc.)
│   │   ├── services/            # Business logic layer
│   │   ├── utils/               # Standalone DB connection tester and helpers
│   │   ├── app.js               # Express application configuration & middleware pipeline
│   │   └── server.js            # Server entrypoint and port listener
│   ├── .env.example             # Backend environment template
│   └── package.json             # Backend dependencies and scripts
│
├── .gitignore                   # Comprehensive root git ignore rules
├── package.json                 # Root orchestration scripts
└── README.md                    # Project documentation
```

---

## ⚡ Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14.0 or higher (optional for Phase 1 API health, required for database operations)

### 1. Installation

Install all dependencies across the workspace (root, server, and client):

```bash
# In the root FlowSync directory:
npm run install:all
```

Or install independently:

```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

---

### 2. Environment Configuration

#### Backend Configuration
Copy `.env.example` to `.env` in the `server/` directory:

```bash
cd server
cp .env.example .env
```

Adjust the database credentials as needed:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flowsync
```

#### Frontend Configuration
Copy `.env.example` to `.env` in the `client/` directory:

```bash
cd client
cp .env.example .env
```

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

### 3. Running the Application

You can start both frontend and backend concurrently from the root directory:

```bash
npm run dev
```

Or run each service in separate terminal sessions:

#### Start Backend:
```bash
cd server
npm run dev
```
*Backend runs at:* `http://localhost:5000`  
*Health Check endpoint:* `http://localhost:5000/api/health`

#### Start Frontend:
```bash
cd client
npm run dev
```
*Frontend runs at:* `http://localhost:5173`

---

## 🔍 Verification & Health Check

1. Open `http://localhost:5173` to explore the FlowSync landing page and navigate between the placeholder routes (`/login`, `/register`, `/dashboard`).
2. The UI features a real-time **System Status indicator** communicating with the backend `/api/health` endpoint.
3. Test the backend directly:
   ```bash
   curl http://localhost:5000/api/health
   ```
   Expected response:
   ```json
   {
     "success": true,
     "message": "FlowSync API is running",
     "timestamp": "2026-09-29T11:15:00.000Z",
     "environment": "development"
   }
   ```
