# FlowSync — Security Architecture & Policy Specification

This document details the multi-tiered defense-in-depth security model implemented in **FlowSync**.

---

## 1. Multi-Tiered Security Model

FlowSync utilizes a four-tier defense architecture:

```text
1. Client-Side Authentication (Supabase Auth JWT)
        ↓
2. Express Middleware Authorization (authMiddleware & rbacMiddleware)
        ↓
3. Application Layer Business Logic & IDOR Guards
        ↓
4. PostgreSQL Row-Level Security (RLS) & Definer Triggers
```

---

## 2. Authentication Architecture

- **Auth Provider**: Supabase Authentication (OAuth / Email+Password).
- **JWT Verification**:
  - The frontend automatically injects the active Bearer token into all outgoing Axios requests (`client/src/services/api.js`).
  - The Express backend (`server/src/middleware/authMiddleware.js`) verifies the cryptographic signature with Supabase Auth via `supabase.auth.getUser(token)`.
  - The verified `req.user` context is attached for downstream authorization.
- **No Password Persistence**: FlowSync does not store, hash, or process raw passwords in application database tables.
- **No Client Secrets**: Only public anon keys (`VITE_SUPABASE_ANON_KEY`) are present on the frontend. Service role keys are strictly omitted.

---

## 3. Role-Based Access Control (RBAC)

FlowSync supports four distinct organization roles with deterministic permissions:

| Role | Organization Scope | Project Scope | Task Scope | Workspace Files |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Full Management | Create / Edit / Delete | Full CRUD & Assign | Upload / Delete All |
| **Project Manager** | Read Only | Create / Edit / Delete | Full CRUD & Assign | Upload / Delete Own |
| **Member** | Read Only | View Assigned Projects | Create / Update Assigned | Upload / Delete Own |
| **Viewer** | Read Only | Read Only | Read Only | Read Only |

### RBAC Middleware
- `requireRole(...roles)`: Restricts endpoints to specific organization roles.
- `requirePermission(permission)`: Checks whether the caller's role satisfies the granular permission matrix (e.g. `organization.update`, `members.manage`, `projects.create`).

---

## 4. Insecure Direct Object Reference (IDOR) Defenses

Every Express endpoint validates that the target entity belongs to the organization that the caller is an authenticated member of:

1. **Project IDOR Guard**:
   ```javascript
   const { data: orgMember } = await supabase
     .from('organization_members')
     .select('role')
     .eq('organization_id', project.organization_id)
     .eq('user_id', req.user.id)
     .maybeSingle();
   ```
2. **Task IDOR Guard**:
   Tasks resolve their parent project and organization before any read, edit, or delete action is permitted.
3. **Comment / Message Ownership**:
   Editing or deleting user-authored content requires `author_id === req.user.id` or workspace administrator status.

---

## 5. PostgreSQL Row-Level Security (RLS)

RLS is enabled across all 12 core tables:
- `public.profiles`
- `public.organizations`
- `public.organization_members`
- `public.projects`
- `public.project_members`
- `public.tasks`
- `public.comments`
- `public.activity_logs`
- `public.channels`
- `public.messages`
- `public.notifications`
- `public.attachments`

### Helper Security Functions
- `is_org_member(org_id, uid)`: Security Definer helper verifying membership.
- `is_org_admin(org_id, uid)`: Security Definer helper verifying admin status.
- `is_org_pm_or_admin(org_id, uid)`: Security Definer helper verifying PM or Admin status.
- `prevent_removing_last_admin()`: Database trigger blocking deletion or demotion of the sole administrator.

---

## 6. Storage Security (Supabase Storage)

- **Bucket**: `flow-sync-attachments` (configured as **Private**).
- **Access Strategy**:
  - Direct public access URLs are disabled.
  - Downloads and previews require short-lived cryptographic signed URLs generated via backend verification (`generateSignedUrl(path, 3600)`).
- **File Validation**:
  - Maximum upload size: **10 MB**.
  - Blocked extensions: `.exe`, `.bat`, `.cmd`, `.sh`, `.msi`, `.dll`, `.bin`, `.vbs`, `.ps1`.
  - Permitted extensions: `.pdf`, `.doc`, `.docx`, `.txt`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.zip`.

---

## 7. Realtime Subscription Scoping

- Supabase Realtime channels are strictly scoped:
  - Messages: `realtime:messages:${channelId}` filtered by `channel_id=eq.${channelId}`.
  - Notifications: `realtime:notifications:${userId}` filtered by `user_id=eq.${userId}`.
- All subscriptions clean up and unregister on view unmount to prevent resource exhaustion and ghost listeners.
