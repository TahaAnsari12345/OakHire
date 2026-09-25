# OakHire CRM

A full-stack recruitment consultancy CRM built for OakHire Pvt Ltd — candidate/client pipeline management, a mandatory-follow-up funnel, a call bridge for candidate and client calls, RBAC dashboards, and an admin-editable CMS. MERN stack, plain JavaScript (no TypeScript).

## Tech stack

**Backend** — Node.js, Express, MongoDB (Mongoose), JWT auth (access token + httpOnly refresh cookie), Zod validation (new endpoints), node-cron.

**Frontend** — React (Vite, JS), React Router, Context API for state (no Redux), Axios, plain CSS with a token-based design system (light/dark theme).

## Repository layout

```
oakhire assign/
├── backend/
│   └── src/
│       ├── config/         # DB connection
│       ├── models/         # Mongoose schemas
│       ├── controllers/    # Request handlers (business logic)
│       ├── services/       # Shared domain logic (calls, timelines)
│       ├── routes/         # Express routers
│       ├── middleware/     # auth, role, validate, error handler
│       ├── validators/     # Zod schemas (calls, follow-ups)
│       └── utils/          # seed scripts, cron, helpers
└── frontend/
    └── src/
        ├── pages/           # Route-level components, grouped by feature
        ├── components/      # Shared/reusable UI (modals, call panel, CMS table)
        ├── context/         # Auth, Theme, Toast, Call, Breadcrumb providers
        ├── services/        # API calls for newer features (calls, follow-ups)
        ├── hooks/           # Data-fetching hooks (options lists, employees)
        └── api/             # Axios instance + interceptors
```

## Architecture

### Auth & RBAC
JWT access token (short-lived, kept in memory) + refresh token in an httpOnly cookie. Two roles: `super_admin` and `employee`. Every protected route goes through `requireAuth` (verifies JWT) → `requireRole` (checks permission, where needed) → **ownership filtering inside the controller** (`assignedTo: req.user.id` for employees). Ownership is never enforced only in the UI — an employee hitting another employee's record directly gets a 404, not a 403, to avoid confirming the record exists.

### Core data model
- `User` — employees + admin (`role` field)
- `Candidate` — the person; owned by an employee via `assignedTo`
- `Client` — hiring company; can have multiple contacts
- `JobRequirement` — an open role under a `Client`
- `Application` — the join of `Candidate` × `JobRequirement`; carries its own `funnelStage` (a candidate can be at different stages on different requirements at once)
- `Followup` — belongs to exactly one of a `Candidate` or a `Client` (validated at the schema level); every non-terminal `Application` must have an open follow-up
- `CallLog` — a call to a `Candidate` or a `Client`; `application`/`jobRequirement` are optional context
- `FunnelStage`, `CallDispositionType`, `LeadSource` — admin-editable option lists (CMS), never hardcoded in the frontend
- `ActivityLog` — every stage change / transfer logged with actor + timestamp
- `Notification` — in-app alerts (e.g. missed-follow-up escalation to admin)

### The funnel rule
Moving an `Application` to a new `funnelStage` (`PUT /api/applications/:id/stage`) is blocked unless the request either schedules a `nextFollowupDate` or the new stage is terminal (Joined/Rejected). Rejecting requires a reason from a fixed list; Joining requires a joining date and auto-closes any open follow-ups. This is enforced server-side — the generic `PATCH /applications/:id` does not accept `funnelStage` at all, so the rule can't be bypassed.

### The call bridge
`POST /api/calls/initiate` creates a `CallLog` with `callStatus: "initiated"` and a server-side `startedAt`. `POST /api/calls/:id/end` computes `durationSeconds` server-side (never trusts the client timer). The employee then logs the outcome via `PUT /api/call-logs/:id`, which updates that same record — never creates a second one. If they close the form without saving, the call stays "undisposed" and resurfaces via a top-bar badge. A disposition's `requiresFollowup` flag (admin-editable) is enforced server-side regardless of what the frontend did. One set of components (`CallButton`, `ActiveCallPanel`, `CallLogForm`, `ActivityTimeline`) serves both candidate and client calls — parameterized by `calleeType`, not duplicated.

The active call is tracked in a `CallContext` at the React layout level, so the timer survives navigation and restores from `GET /api/calls/active` after a page refresh.

### Follow-up escalation (cron)
A daily `node-cron` job sweeps `Followup`s: overdue `Pending` ones become `Missed`; anything missed more than 2 days (configurable) escalates to a `Notification` for the Super Admin (idempotent — won't re-notify on the next run). Manually triggerable from the admin UI for testing without waiting for midnight.

### CMS pattern
`FunnelStage`, `CallDispositionType`, and `LeadSource` are admin-editable master lists, all built on one reusable frontend component (`MasterListCMS`) parameterized by field config. Every dropdown in the app that shows a stage, disposition, or source fetches it live from these — nothing is hardcoded.

### Theming
All colors are CSS custom properties on `:root`, overridden under `[data-theme="dark"]`. Theme is resolved before first paint (inline script in `index.html`, reading `localStorage` then `prefers-color-scheme`) to avoid a flash of the wrong theme.

## Getting started

### Prerequisites
- Node.js 18+
- A MongoDB connection string (Atlas or local)

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT secrets, etc.
npm run dev             # or: npm start
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL, defaults to http://localhost:5000/api
npm run dev
```

### Seed demo data (optional, wipes existing data)
```bash
cd backend
npm run seed:demo
```
Prints demo login credentials (1 admin, 3 employees) to the console on completion.

## Environment variables

**backend/.env**
| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Token signing secrets |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes |
| `CLIENT_URL` | Frontend origin, added to the CORS allow-list |

**frontend/.env**
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL |
