# FlowSync (Zetoco)

<div align="center">

  <h1>⚡ FlowSync</h1>
  <p><strong>Enterprise-Grade Project, Task & Team Collaboration Platform</strong></p>
  <p><em>Where cross-functional teams, agile workflows, and real-time communication stay in perfect sync.</em></p>

  <div>
    <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Vite-6.1.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express-4.21.2-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Supabase-Auth_%26_Realtime-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Tests-87%2F87_Passed-brightgreen?style=for-the-badge&logo=checkmarx&logoColor=white" alt="Tests" />
  </div>

  <br />

  <p>
    <a href="#-key-features">Features</a> •
    <a href="#-system-architecture">Architecture</a> •
    <a href="#-database-schema">Database</a> •
    <a href="#-rest-api-documentation">API Reference</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-security-and-testing">Security & Testing</a>
  </p>

</div>

---

## 📌 Overview

**FlowSync** (branded in-app as **Zetoco**) is a full-stack, multi-tenant collaboration platform engineered for high-velocity software engineering, product, and design organizations. Combining the workflow execution of **Jira**, the visual agility of **Linear**, and the instant communication of **Slack**, FlowSync delivers an all-in-one workspace designed with a production-first mindset.

Built from the ground up with a four-tier defense-in-depth security model, PostgreSQL Row-Level Security (RLS), Supabase Realtime WebSockets, and a Jira-inspired Design System with full Light & Dark mode support.

---

## ✨ Key Features

### 🏢 1. Multi-Tenant Organizations & Workspaces
- **Workspace Isolation**: Clean boundaries separating organizations, members, projects, and assets.
- **Dynamic Organization Switcher**: Instant switching between multiple workspaces without re-authenticating.
- **Custom Slugs & Metadata**: Normalized, URL-friendly unique slugs (`acme-corp`) and workspace branding.
- **Organization Lifecycle**: Full settings administration, member directory, and guarded cascade deletion with multi-step confirmation modals.
- **Sole Admin Protection**: Database triggers prevent deleting or demoting the last remaining administrator.

### 🛡️ 2. Granular Role-Based Access Control (RBAC)
- **4-Tier Permission Matrix**:
  - 👑 **Admin**: Full workspace control, billing/settings management, member invitations, and role assignments.
  - 💼 **Project Manager**: Project creation, lifecycle management, sprint assignment, and task orchestration.
  - 👷 **Member**: Create and update assigned tasks, participate in discussions, upload assets, and collaborate in channels.
  - 👁️ **Viewer**: Strict read-only visibility across projects, boards, team directory, and analytics.
- **End-to-End Enforcement**: Client-side UI gates (`<Can>`, `<PermissionRoute>`) backed by strict Express middleware (`requireRole`, `requirePermission`) and PostgreSQL RLS.

### 📋 3. Interactive Jira Kanban Board & Task Engine
- **5-Stage Workflow Pipeline**: `Backlog` ➔ `To Do` ➔ `In Progress` ➔ `In Review` ➔ `Done`.
- **HTML5 Drag-and-Drop**: Fluid task card re-ordering and status transitions with optimistic UI feedback and automatic `order_index` normalization.
- **Dual Views**: Seamless toggling between an interactive **Kanban Board** and a high-density **List View**.
- **Comprehensive Task Attributes**: Title, rich description, priority tiers (`Urgent`, `High`, `Medium`, `Low`), due dates, assignee selectors, and custom tag labels.
- **Live Overdue Detection**: Real-time visual alerts and overdue badges linked to sprint deadlines.
- **Multi-Filter System**: Instant filtering by search terms, status, priority, and assignees.

### 💬 4. Real-Time Team Channels & Instant Messaging
- **Persistent Channels**: Dedicated organization-wide channels (auto-provisioned `#general` plus custom public/private channels).
- **Supabase Realtime WebSockets**: Sub-millisecond bidirectional message synchronization without browser polling.
- **Author Identity & Timestamps**: User avatars, job titles, and formatted relative timestamps.
- **Channel Cleanup**: Automatic teardown of WebSocket listeners during unmounting to prevent memory leaks and redundant traffic.

### 🔔 5. Real-Time In-App Notification Center
- **Automated Event Triggers**: Instant alerts generated on task assignment, status updates, mentions, role promotions, and team invitations.
- **Scoped User Delivery**: Realtime push subscriptions routed strictly to `realtime:notifications:${userId}` channels.
- **Unread Counter & Management**: Live badge counts, one-click "Mark All as Read", single-item dismissals, and direct deep-linking to referenced entities.

### 👥 6. Team Directory & Invitation Workflows
- **Dual Invitation Paths**:
  - **Secure Token Links**: Cryptographically signed (`SHA-256`) invitations shared via external link (`/invitations/accept/:token`).
  - **Direct In-App Invitations**: Direct invites for existing users with responsive **Accept** or **Decline** actions.
- **Team Management**: Real-time role reassignment, member removal, and profile inspection modals.

### 📝 7. Threaded Discussions & Audit Trail
- **Task Comments**: Live comment threads attached directly to individual task modals with author edit/delete permissions.
- **Immutable Activity Logs**: Automatic audit trail (`activity_logs`) recording task creation, status transitions, priority edits, assignee shifts, and file attachments.

### 📊 8. Visual Analytics & KPI Telemetry
- **Executive KPI Cards**: Real-time counters calculating Total Projects, Active Projects, Open Tasks, Completed Tasks, and Overdue Tasks with velocity ratios.
- **Interactive Recharts Dashboards**:
  - **Task Status Distribution**: Visual status breakdown donut chart.
  - **Task Priority Breakdown**: Workload urgency distribution bar chart.
  - **Project Status Summary**: Active vs. completed project pipeline bar chart.
  - **Team Workload Balancing**: Task allocation ratios mapped across active team members.
- **Adaptive Theming**: Full visual compatibility across both Jira Light and Dark modes.

### 📎 9. Enterprise File & Asset Management
- **Private Supabase Storage**: Dedicated secure bucket (`flow-sync-attachments`) protected by storage RLS policies.
- **Drag-and-Drop Upload Zones**: Interactive file dropzone with validation (10 MB size limits and executable type blacklists).
- **Short-Lived Signed URLs**: Temporary access URLs (3,600-second TTL) for secure previews, lightbox inspections, and downloads.
- **Workspace & Task Repositories**: Workspace-wide file explorer (`/files`) and task-specific attachment tabs with synchronized deletion.

### 🎨 10. Jira & Linear-Inspired Aesthetic
- **Jira Light & Dark Themes**: Pixel-perfect SaaS interface built with custom Tailwind design tokens and persistent state (`localStorage` + system OS auto-detection).
- **Custom UI Component System**: 18+ hand-crafted accessible components (Modals, Dropdowns, Tooltips, Toasts, Skeletons, Badges, Avatars, EmptyStates, ErrorBoundaries).

---

## 🏗️ System Architecture

FlowSync uses a decoupled client-server architecture with an isolated database and storage engine:

```mermaid
flowchart TD
    subgraph Client ["Frontend Application (React + Vite)"]
        UI["Tailwind UI & Views"]
        AuthCtx["Auth Context (Supabase JWT)"]
        RTClient["Realtime Subscriptions (WebSocket)"]
        APIClient["Axios Client (Bearer Interceptor)"]
    end

    subgraph Server ["Backend REST API (Node.js + Express)"]
        AuthMW["Auth Middleware (JWT Signature Verification)"]
        RBACMW["RBAC Middleware (requireRole / requirePermission)"]
        Controllers["Controllers & Routes"]
        Services["Activity & Notification Services"]
    end

    subgraph Supabase ["Supabase Cloud / PostgreSQL"]
        AuthService["Supabase Auth (Users & Sessions)"]
        DB[(PostgreSQL Database + RLS)]
        Storage["Private Storage Bucket (flow-sync-attachments)"]
        Realtime["Realtime Engine (CDC WebSockets)"]
    end

    UI --> AuthCtx
    AuthCtx -->|Sign In / Sign Up| AuthService
    UI --> APIClient
    APIClient -->|HTTP + Bearer Token| AuthMW
    AuthMW --> RBACMW
    RBACMW --> Controllers
    Controllers --> Services
    Services --> DB
    UI -->|Listen: messages & notifications| Realtime
    Realtime -.->|Push Events| RTClient
    UI -->|Upload Files & Request Signed URLs| Storage
```

---

## 🗄️ Database Schema

The database model consists of **12 core relational tables** with Row-Level Security (RLS) enabled across every table:

| Table | Description | Primary Key | Foreign Keys & Relationships |
| :--- | :--- | :--- | :--- |
| `public.profiles` | User profiles synced from `auth.users` | `id` (UUID) | 1:1 `auth.users(id)` ON DELETE CASCADE |
| `public.organizations` | Tenant workspaces with unique slugs | `id` (UUID) | `created_by` ➔ `profiles(id)` |
| `public.organization_members` | Organization memberships & assigned roles | `id` (UUID) | `organization_id`, `user_id` |
| `public.organization_invitations` | Pending tokenized & in-app workspace invites | `id` (UUID) | `organization_id`, `invited_by`, `invited_user_id` |
| `public.projects` | Workspace projects with statuses & priorities | `id` (UUID) | `organization_id`, `created_by` |
| `public.project_members` | Project-level contributor assignments | `id` (UUID) | `project_id`, `user_id` |
| `public.tasks` | Kanban tasks, orders, deadlines & assignments | `id` (UUID) | `project_id`, `organization_id`, `assignee_id` |
| `public.comments` | Threaded task comments & feedback | `id` (UUID) | `task_id`, `user_id` |
| `public.activity_logs` | Immutable audit trail for task actions | `id` (UUID) | `task_id`, `project_id`, `user_id` |
| `public.channels` | Team chat channels (default `#general`) | `id` (UUID) | `organization_id`, `created_by` |
| `public.messages` | Real-time chat messages with timestamps | `id` (UUID) | `channel_id`, `user_id` |
| `public.notifications` | In-app user notifications & read states | `id` (UUID) | `user_id`, `organization_id` |
| `public.attachments` | Metadata for files stored in Supabase Storage | `id` (UUID) | `task_id`, `organization_id`, `uploaded_by` |

---

## 💻 Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) (Vite bundler)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/) + PostCSS & Autoprefixer
- **Routing**: [React Router v6.28](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts 3.10](https://recharts.org/)
- **HTTP Client**: [Axios](https://axios-http.com/) with global interceptors
- **Backend SDK**: [@supabase/supabase-js](https://supabase.com/docs/reference/javascript)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (v18+)
- **Framework**: [Express.js 4.21](https://expressjs.com/)
- **Database Driver**: [`pg`](https://node-postgres.com/) (Connection pooling)
- **Auth & Storage Client**: `@supabase/supabase-js` (Token verification & Private storage signing)
- **Security Utilities**: `crypto` (SHA-256 invitation hashing), `cors`, `dotenv`
- **Development Tooling**: `nodemon`, `concurrently`

### Cloud Infrastructure & Database
- **Database**: PostgreSQL 15+ hosted via [Supabase](https://supabase.com/)
- **Authentication**: Supabase Auth (JWT Bearer Token verification)
- **Object Storage**: Supabase Storage (`flow-sync-attachments` private bucket)
- **Realtime Dispatch**: Supabase Realtime Engine (PostgreSQL Change Data Capture over WebSockets)

---

## 📂 Project Structure

```text
FlowSync/
├── client/                               # Frontend Application (React + Vite)
│   ├── public/                           # Static assets & public icons
│   ├── src/
│   │   ├── assets/                       # Branding logos & icon resources
│   │   ├── components/                   # Modular UI component tree
│   │   │   ├── analytics/                # Recharts KPI & distribution graphs
│   │   │   ├── attachments/              # File dropzones, cards & lightbox modals
│   │   │   ├── auth/                     # Route guards (ProtectedRoute, Can, PermissionRoute)
│   │   │   ├── common/                   # Navbar, Footer, ThemeToggle, ErrorBoundary
│   │   │   ├── invitations/              # Pending invitation management
│   │   │   ├── kanban/                   # Interactive Drag-and-Drop Kanban Board
│   │   │   ├── modals/                   # Creation & management modals
│   │   │   ├── tasks/                    # Task list and table views
│   │   │   └── ui/                       # Design system primitives (Button, Modal, Toast...)
│   │   ├── constants/                    # Permissions, navigation links, role matrices
│   │   ├── context/                      # Auth, Organization, Project, Theme, Notifications
│   │   ├── hooks/                        # useRealtimeMessages, useRealtimeNotifications
│   │   ├── layouts/                      # MainLayout (marketing) & DashboardLayout (app shell)
│   │   ├── lib/                          # Supabase browser client configuration
│   │   ├── pages/                        # Route page views (Dashboard, Tasks, Messages, etc.)
│   │   ├── services/                     # Centralized Axios API services
│   │   ├── utils/                        # Activity log formatters, org helpers
│   │   ├── App.jsx                       # Main application routing tree
│   │   ├── index.css                     # Tailwind directives & CSS design tokens
│   │   └── main.jsx                      # DOM mount entrypoint
│   ├── .env.example                      # Client environment template
│   ├── package.json                      # Client dependencies & scripts
│   ├── tailwind.config.js                # Tailwind theme extensions & design tokens
│   └── vite.config.js                    # Vite bundler & proxy configuration
│
├── server/                               # Backend REST API (Node.js + Express)
│   ├── src/
│   │   ├── config/                       # DB connection pool & Supabase client config
│   │   ├── constants/                    # Role definitions & permission hierarchies
│   │   ├── controllers/                  # Health & system status controllers
│   │   ├── middleware/                   # JWT authMiddleware, rbacMiddleware, errorHandler
│   │   ├── routes/                       # Modular REST API endpoints
│   │   ├── services/                     # Activity logging & notification broadcast services
│   │   ├── utils/                        # Database connectivity check & org utilities
│   │   ├── app.js                        # Express middleware pipeline assembly
│   │   └── server.js                     # HTTP server startup & listener
│   ├── .env.example                      # Server environment template
│   └── package.json                      # Server dependencies & scripts
│
├── supabase/                             # Database Migrations & Schemas
│   └── migrations/                       # Incremental SQL migrations & master schema
│       └── master_all_phases_schema.sql  # Complete initialization script
│
├── .gitignore                            # Comprehensive git ignore rules
├── package.json                          # Workspace root script runner
├── README.md                             # Repository documentation
├── SECURITY.md                           # Security architecture & IDOR audit specification
└── TESTING.md                            # Comprehensive 87-scenario testing verification
```

---

## 📡 REST API Documentation

All API endpoints are prefixed with `/api` and return standardized JSON envelopes:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional status message"
}
```

### Endpoints Overview

| Category | Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/api/health` | Service health status check | Public |
| | `GET` | `/api/health/full` | Database connection pool ping | Public |
| **Users** | `GET` | `/api/users/profile` | Current user profile | Authenticated |
| | `PUT` | `/api/users/profile` | Update profile information | Authenticated |
| **Organizations**| `GET` | `/api/organizations` | List organizations user belongs to | Authenticated |
| | `POST` | `/api/organizations` | Create a new organization workspace | Authenticated |
| | `GET` | `/api/organizations/:id`| Get organization details & members | Org Member |
| | `PUT` | `/api/organizations/:id`| Update organization settings | Org Admin |
| | `DELETE`| `/api/organizations/:id`| Delete organization and cascade data | Org Admin |
| **Invitations** | `GET` | `/api/invitations/pending`| Get current user's pending invites | Authenticated |
| | `POST` | `/api/organizations/:id/invitations`| Invite member by email / in-app | Org Admin / PM |
| | `POST` | `/api/invitations/accept/:token`| Accept invite via secret token | Authenticated |
| | `POST` | `/api/invitations/:id/accept`| Accept in-app workspace invite | Recipient |
| | `POST` | `/api/invitations/:id/decline`| Decline in-app workspace invite | Recipient |
| **Projects** | `GET` | `/api/projects?organizationId=`| List projects in workspace | Org Member |
| | `POST` | `/api/projects` | Create a new project | Admin / PM |
| | `GET` | `/api/projects/:id` | Get project details & contributors | Project Member |
| | `PUT` | `/api/projects/:id` | Update project metadata/status | Admin / PM |
| | `DELETE`| `/api/projects/:id` | Delete or archive project | Admin / PM |
| **Tasks** | `GET` | `/api/tasks?projectId=` | List tasks with filters & sorting | Project Member |
| | `POST` | `/api/tasks` | Create a task in a project | Member+ |
| | `PUT` | `/api/tasks/:id` | Update task details & order index | Member+ |
| | `DELETE`| `/api/tasks/:id` | Remove task and cascade relations | Admin / PM / Creator |
| **Comments** | `GET` | `/api/tasks/:taskId/comments` | List comments on task | Project Member |
| | `POST` | `/api/tasks/:taskId/comments` | Post comment to task thread | Member+ |
| | `DELETE`| `/api/comments/:id` | Delete comment | Author / Admin |
| **Channels** | `GET` | `/api/channels?organizationId=`| List workspace chat channels | Org Member |
| | `POST` | `/api/channels` | Create a new chat channel | Admin / PM |
| **Messages** | `GET` | `/api/messages?channelId=` | Get channel message history | Org Member |
| | `POST` | `/api/messages` | Post a real-time message | Org Member |
| **Notifications**| `GET`| `/api/notifications` | Get user notifications | Authenticated |
| | `PATCH`| `/api/notifications/:id/read` | Mark single notification as read | Recipient |
| | `PATCH`| `/api/notifications/read-all` | Mark all notifications as read | Recipient |
| **Attachments** | `GET` | `/api/attachments?organizationId=`| Workspace files directory | Org Member |
| | `POST` | `/api/attachments` | Upload attachment & store record | Member+ |
| | `GET` | `/api/attachments/:id/url` | Generate temporary signed URL | Org Member |
| | `DELETE`| `/api/attachments/:id` | Delete file from storage & database | Uploader / Admin |
| **Analytics** | `GET` | `/api/analytics?organizationId=` | Aggregate KPIs & chart metrics | Org Member |

---

## ⚡ Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Supabase Account**: A free cloud project at [supabase.com](https://supabase.com) (or a local Supabase CLI instance)

---

### 1. Clone the Repository

```bash
git clone https://github.com/AashishFad/Zetoco.git
cd Zetoco
```

---

### 2. Install Dependencies

Install all dependencies across root, server, and client with a single command:

```bash
npm run install:all
```

*Alternatively, install independently:*
```bash
# Server dependencies
cd server && npm install

# Client dependencies
cd ../client && npm install
```

---

### 3. Database & Supabase Setup

1. Log into your **Supabase Dashboard** and navigate to your project.
2. Go to the **SQL Editor**.
3. Open [`supabase/migrations/master_all_phases_schema.sql`](supabase/migrations/master_all_phases_schema.sql) from this repository, copy its contents, paste them into the SQL Editor, and click **Run**.
   - This sets up all 12 tables, triggers, indexes, and Row-Level Security policies.
4. Go to **Storage** in the Supabase Dashboard:
   - Create a new bucket named `flow-sync-attachments`.
   - Set the bucket to **Private** (disallow public URL access).
5. Ensure **Realtime** is enabled for the `messages` and `notifications` tables in **Database ➔ Publications**.

---

### 4. Configure Environment Variables

#### Backend (`server/.env`)
Create a `.env` file in the `server/` directory:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# PostgreSQL Connection String (Found in Supabase: Project Settings -> Database)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Supabase API Credentials (Project Settings -> API)
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-SUPABASE-ANON-KEY]
```

#### Frontend (`client/.env`)
Create a `.env` file in the `client/` directory:

```env
# Express API Base URL
VITE_API_BASE_URL=http://localhost:5000/api

# Supabase Public Keys
VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-SUPABASE-ANON-KEY]
```

---

### 5. Run the Application

Start both the backend server and frontend client concurrently:

```bash
npm run dev
```

The application will be accessible at:
- 🖥️ **Frontend Client**: `http://localhost:5173`
- ⚙️ **Backend API**: `http://localhost:5000`
- 🩺 **Health Check**: `http://localhost:5000/api/health`

---

## 🔒 Security & Testing

### Defense-in-Depth Security
FlowSync adheres to strict security standards:
- **No Plaintext Passwords**: Password management and token issuance are strictly delegated to Supabase Auth.
- **Strict Insecure Direct Object Reference (IDOR) Guards**: Every entity query validates parent workspace membership before permitting reads or mutations.
- **Row-Level Security (RLS)**: Enforced across all tables so unauthorized queries fail even at the database layer.
- **Signed Storage Access**: File attachments are never made publicly world-readable; access is granted via short-lived signed URLs (1 hour TTL).

> For detailed specifications on the security architecture, refer to [`SECURITY.md`](SECURITY.md).

### Functional Quality Assurance
FlowSync has been verified across **87 automated and manual end-to-end test scenarios**:
- ✅ Authentication & Session Guards (6/6)
- ✅ Multi-Tenant Isolation & Slugs (6/6)
- ✅ RBAC Authorization & Middleware (8/8)
- ✅ Project Lifecycle & Workflows (7/7)
- ✅ Kanban Drag-and-Drop & Index Reordering (9/9)
- ✅ Threaded Comments & Activity Logs (6/6)
- ✅ Channels & WebSocket Chat (7/7)
- ✅ In-App Notifications & Badges (8/8)
- ✅ Storage Validation & Signed Previews (8/8)
- ✅ Dashboard Metrics & Chart Visualizations (8/8)
- ✅ Cross-Tenant IDOR Attack Mitigations (9/9)
- ✅ Responsive Design & Accessibility (5/5)

> For full test logs and scenario matrices, refer to [`TESTING.md`](TESTING.md).

---

## 📄 License

This project is open-source and available under the [ISC License](LICENSE).

---

## 👨‍💻 Author

**Aashish Fad**
- GitHub: [@AashishFad](https://github.com/AashishFad)
- Repository: [AashishFad/Zetoco](https://github.com/AashishFad/Zetoco)

---

<div align="center">
  <sub>Engineered with precision for modern engineering teams. If you find this project helpful, give it a ⭐️!</sub>
</div>
