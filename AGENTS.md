<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Preserve the existing data and authentication adapters during frontend-only demo work; no additional integrations or migration changes are needed.
- Keep report date-cohort and weekly aggregation helpers in `src/lib/reporting.ts` so charts and exports share testable period rules.
- Reuse `TaskRelatedWork` in both task dialogs; goals are related by assignee, not falsely presented as task-linked goals.
- Store shared membership and individual progress in task_assignments; use admin-checked atomic RPCs for assignment changes and approval-checked own-assignment RPCs for intern updates. Keep task-level progress aggregated and overlay personal progress only for intern/member views to avoid cross-intern overwrites.
- Keep the member directory at `/team` and un-nested member profiles at `/team/$id`; legacy Interns URLs redirect to these surfaces to preserve bookmarks without duplicate pages.
- Keep member job titles separate from authenticated account roles; read existing role rows for display only and retain server-side authorization for account actions.
- Use `/auth` for both login roles, default to the intern form, and reject account-role mismatches through the existing `my_role` RPC; UI selection never grants access.
- Recover missing intern requests through authenticated request_intern_access or a one-time verified-account backfill using saved signup names; never fabricate registrations or approval decisions.
- Capture new self-registered interns atomically with an Auth lifecycle trigger into existing access_requests; registration_type identifies the workflow but never grants roles.
- Enforce current intern authorization through is_approved_intern and restrictive data/storage policies; preserve approved legacy accounts without requiring a historical request.
- Never bootstrap admin roles through a caller-accessible RPC after initial provisioning; existing admins approve account access.
- Admin intern approval confirms the existing Auth account server-side before the role decision, so email links never authorize access; failed decisions leave database approval gates intact.
