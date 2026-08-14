# Fix: admins bounced when opening another user's briefing

## What's happening

On the briefing detail page, the admin check (`useAdmin`) resolves asynchronously, but the page starts loading the briefing immediately without waiting for it. On that first pass `isAdmin` is still `false`, so the query is filtered to your own records, the other user's briefing comes back empty, and the page shows the "Failed to load briefing" error and redirects to the dashboard before the admin status ever arrives.

Confirmed: `src/pages/BriefingDetail.tsx:49` reads only `isAdmin` from `useAdmin()` and ignores its `loading` flag, while every other admin-gated screen (`AdminProtectedRoute`, `AdminLogin`) waits on that flag.

Your own briefings work because the owner-filtered query succeeds regardless of admin status.

## The fix

In `src/pages/BriefingDetail.tsx`:

- Read `loading: adminLoading` from `useAdmin()` alongside `isAdmin`.
- Skip the fetch while `adminLoading` is true (keep the existing skeleton visible), and add `adminLoading` to the effect dependencies so the fetch runs once admin status is known.
- Only treat a missing briefing as an error after admin status has resolved, so no premature redirect to the dashboard.

No changes to database policies, migrations, edge functions, or routes — the admin read permissions already exist on the backend.

## Scope

Single file: `src/pages/BriefingDetail.tsx`.
