# Super Admin Refactoring Plan

## Current State
- No roles, no Admin model, no auth on any admin route
- Admin shell always accessible, no login required
- Single `Student` model handles all users

---

## What We're Building

### Roles
| Role | Access |
|------|--------|
| `super_admin` | Full platform — all pages, all data, manage admins |
| `center_admin` | Own center's exams, students, results |
| `moderator` | Questions only (manage question bank) |

---

## Phase 1 — Database Schema

**File:** `backend/prisma/schema.prisma`

Add `Admin` model:
```
model Admin {
  id           Int         @id @default(autoincrement())
  name         String
  email        String      @unique
  passwordHash String
  role         String      @default("moderator")  // super_admin | center_admin | moderator
  centerId     Int?
  center       ExamCenter? @relation(...)
  sessionToken String?     @unique
  status       String      @default("active")
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}
```

Add `admins` relation to `ExamCenter`.

Run `prisma migrate dev` + seed default super_admin.

---

## Phase 2 — Backend: Admin Auth

**New file:** `backend/src/routes/adminAuth.js`
- `POST /api/admin/login` — email+password → adminToken
- `GET  /api/admin/me`    — returns admin profile + role + centerId
- `POST /api/admin/logout`

**New file:** `backend/src/middleware/adminAuth.js`
```js
export function requireAdmin(req, reply, done)     // any admin token
export function requireSuperAdmin(req, reply, done) // role === "super_admin"
export function requireCenterAccess(centerId)       // super_admin OR matching center_admin
```

Token stored by frontend as `armexam_admin_token` (separate from student token).

---

## Phase 3 — Backend: Protect All Admin Routes

Add `requireAdmin` hook to ALL existing routes:
- `questions.js` — requireAdmin
- `exams.js`     — requireAdmin (center_admin: only own center's exams)
- `students.js`  — requireAdmin
- `cities.js`    — CRUD: requireAdmin; centers CRUD: requireAdmin
- `sections.js`  — requireAdmin
- `results.js`   — requireAdmin
- Analytics      — requireAdmin

Public routes (no auth needed):
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/register/pin/:pin` (kiosk)
- `GET /api/centers/:id/exams` (student registration flow)
- `POST /api/user/register-exam` (student token)

---

## Phase 4 — Backend: Admin Management API

**New file:** `backend/src/routes/admins.js`
- `GET    /api/admins`     — list all admins (super_admin only)
- `POST   /api/admins`     — create admin (super_admin only)
- `PUT    /api/admins/:id` — update admin (super_admin only)
- `DELETE /api/admins/:id` — delete admin (super_admin only, cannot delete self)

---

## Phase 5 — Frontend: Admin Auth

**New page:** `src/pages/AdminLogin.jsx`
- Login form (email + password)
- Calls `api.adminLogin()` → stores token as `armexam_admin_token`

**New api methods in `src/api.js`:**
```js
adminLogin:  (data) => req('/admin/login', { POST })
adminMe:     ()     => req('/admin/me')
adminLogout: ()     => req('/admin/logout', { POST })
getAdmins:   ()     => req('/admins')
createAdmin: (data) => req('/admins', { POST })
updateAdmin: (id, data) => req(`/admins/${id}`, { PUT })
deleteAdmin: (id)   => req(`/admins/${id}`, { DELETE })
```

Admin API calls include `Authorization: Bearer <armexam_admin_token>`.

**Update `src/App.jsx`:**
- Add `#admin-login` hash route → AdminLogin page
- On load: check `armexam_admin_token` via `api.adminMe()`
- If no valid admin token → redirect to `#admin-login`
- Admin shell shows current admin name + role in topbar
- Logout button in sidebar

---

## Phase 6 — Frontend: Role-Based Navigation

Filter NAV items based on `admin.role`:

| NAV item | super_admin | center_admin | moderator |
|----------|-------------|--------------|-----------|
| Exams    | ✓ | ✓ | — |
| Questions| ✓ | — | ✓ |
| Students | ✓ | ✓ | — |
| Centers  | ✓ | — | — |
| Analytics| ✓ | ✓ | — |
| Admins   | ✓ | — | — |
| Settings | ✓ | — | — |
| Media    | ✓ | — | — |

---

## Phase 7 — Frontend: Admin Management Page

**New page:** `src/pages/AdminManagement.jsx` (super_admin only)
- List all admins with role badges
- Create admin (name, email, password, role, center assignment)
- Edit admin (change role, center, status)
- Delete admin (with confirmation)

---

## Phase 8 — Frontend: Settings Page

Expand `src/pages/AdminSettings.jsx` (super_admin only):
- System name / branding
- Default exam duration / passing score
- Import/export question bank (JSON)

---

## File Changelist

### New Files
- `backend/src/routes/adminAuth.js`
- `backend/src/routes/admins.js`
- `backend/src/middleware/adminAuth.js`
- `src/pages/AdminLogin.jsx`
- `src/pages/AdminManagement.jsx`

### Modified Files
- `backend/prisma/schema.prisma` — add Admin model
- `backend/prisma/seed.js` — seed super_admin
- `backend/src/server.js` — register new routes
- `backend/src/routes/auth.js` — keep as-is (student only)
- `backend/src/routes/questions.js` — add requireAdmin
- `backend/src/routes/exams.js` — add requireAdmin
- `backend/src/routes/students.js` — add requireAdmin
- `backend/src/routes/cities.js` — add requireAdmin
- `backend/src/routes/sections.js` — add requireAdmin
- `backend/src/routes/results.js` — add requireAdmin
- `src/api.js` — add admin api methods
- `src/App.jsx` — admin auth flow + role-based nav
- `src/pages/AdminSettings.jsx` — implement settings + import/export

---

## Implementation Order

1. Schema + migration + seed
2. Backend auth middleware + admin login routes
3. Protect all existing routes
4. Admin CRUD API
5. Frontend AdminLogin page + App.jsx auth flow
6. Role-based navigation
7. AdminManagement page
8. Settings import/export
