# Premium upgrade of the Task Manager (Admin + Intern)

The app already has: admin pages (dashboard, tasks, interns, team, reports, access, settings), intern pages (dashboard, tasks, work log, notifications, profile), a deep-navy theme, roles, review workflow and notifications in the database. We upgrade in place — no rebuild, no data reset.

## Stage 1 — Design system and shared layout
- Refine tokens in the stylesheet: navy sidebar, blue/violet accents, light surfaces, full dark mode set.
- Shared building blocks: page header, KPI card, empty / loading skeleton / error states, status, priority and review badges, avatar stack, progress bar, confirm dialog.
- One shell for both portals: collapsible sidebar (icon rail on tablet, bottom-sheet menu on mobile), top bar with greeting, date, global search (Ctrl/Cmd+K), notification bell, profile menu, theme toggle.

## Stage 2 — Dashboards
- Admin: 6 KPIs (interns, active, tasks, completed, in progress, overdue) with change vs previous 30 days only when history exists; completion trend, status split, intern productivity, upcoming deadlines, recently assigned, recent activity, overdue alerts. Every widget links to filtered lists.
- Intern: welcome + avatar, task counts, weekly hours, overall progress ring, "Continue working" card, deadlines with urgency, weekly hours chart from work logs, activity timeline.

## Stage 3 — Tasks
- Table / Kanban / Calendar switch, search + filters (status, priority, category, assignee, due range) kept in the URL.
- Kanban drag and drop (admin: any move; intern: own tasks via the existing secure update function).
- Task detail drawer: info, assignee, deadline, progress, comments (task updates), attachments, history, review actions.

## Stage 4 — Intern workspace, reports, notifications, profiles, settings
- Intern task page: progress slider, update editor, "Submit update". Work log: validated form (hours 0–24, progress 0–100, no duplicate entry per task per day), optional private attachment, timeline + table, weekly summary, pagination.
- Reports: date range (7/30/90/custom), completion trends, per-intern completions, hours per week, overdue, priority, workload, completion rate, pending reviews; CSV export of tasks and work logs. Missing history shown as "not enough data".
- Notification center: unread count, mark one / all read, task links, filter.
- Intern profile pages (admin view) with real stats; intern sees only own.
- Settings: profile, theme, notification preferences, table density, password change — saved per user.

## Stage 5 — Database (only what's needed)
- Private storage bucket for work-log attachments, access limited to the owner and admins.
- Unique guard against duplicate work logs per intern/task/day; small indexes for dashboard queries.
- Re-check existing access rules; no loosening.

## Stage 6 — Verification
Sign in as admin and intern, walk through assignment, progress update, review, work log create/edit, notifications, reports, CSV, dark mode and mobile width; fix console errors.

## Technical notes
- Recharts and date-fns already installed; add @dnd-kit for drag and drop.
- Reads via TanStack Query with shared query keys so updates refresh dashboards.
- Intern task changes continue going through intern_update_task (protected fields stay locked).
