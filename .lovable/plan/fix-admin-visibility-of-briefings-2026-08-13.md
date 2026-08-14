Fix admin visibility of briefings

Goal: Allow admins to open and interact with any user's briefing from the admin panel, while keeping non-admin users restricted to their own briefings.

Changes

1. src/pages/BriefingDetail.tsx
   - Import `useAdmin` from `@/hooks/useAdmin` and destructure `isAdmin`.
   - Build the three existing Supabase queries conditionally so `.eq("user_id", user.id)` is only applied when `isAdmin` is false. The queries are:
     - briefings fetch (select by id).
     - briefing_contacts fetch after loading the briefing.
     - briefing_contacts refresh after adding a contact.
   - Introduce `isOwner = briefing.user_id === user.id`.
   - When `isAdmin` is true and `isOwner` is false, render a muted banner above the briefing content reading "Admin view. Created by another user.".
   - Keep the add-contact form, copy actions, and export actions enabled for admins.
   - In `handleContactSubmit`, pass `briefing.user_id` as `user_id` to the edge function instead of `user.id`. When the admin is also the owner this resolves to the same value.

2. src/pages/admin/AdminBriefings.tsx
   - Import `Eye` from `lucide-react`.
   - In each row's actions cell, add a View button before the existing Pencil button. Use `Link` to `/briefings/${briefing.id}`, use the same `variant="ghost" size="icon" h-8 w-8` styling as the Pencil button, set `aria-label="View briefing"`, and wrap the `Eye` icon with `h-4 w-4` sizing.

Constraints

- No RLS policy changes.
- No database migrations.
- No Supabase edge function changes.
- No changes to `src/components/briefing/BriefingDisplay.tsx`.
- No changes to `src/App.tsx` or routes.
- No unrelated refactoring.
- Only modify `src/pages/BriefingDetail.tsx` and `src/pages/admin/AdminBriefings.tsx`.
