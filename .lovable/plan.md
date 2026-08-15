# Stage A Addendum: Buyer roles come from the profile

Replace the five hardcoded IT-staffing buyer roles with a profile-driven list.

## 1. Database

Migration adding to `public.company_profile`:

```sql
ALTER TABLE public.company_profile
  ADD COLUMN buyer_roles jsonb NOT NULL DEFAULT '[]'::jsonb;
```

Then seed the Moxxy row (data update, via the insert tool) with:

```
["Owner / CEO", "Marketing Director", "CMO / VP Marketing", "Sales Leadership", "Operations Leadership"]
```

`src/integrations/supabase/types.ts` gains `buyer_roles: Json` on the `company_profile` Row/Insert/Update types.

## 2. Validation

- `src/lib/schemas.ts` line 17: `target_contact_type` becomes `z.string().min(1, "Select a target contact type")`.
- `supabase/functions/generate-company-briefing/index.ts` line 24: becomes `z.string().min(1)`. Function redeployed. Nothing else about how the value reaches the prompt changes.

## 3. CompanyForm

- On mount, select `buyer_roles` from `company_profile` (single row).
- Render one `SelectItem` per role instead of the five hardcoded ones.
- Default value = first item in `buyer_roles`; applied once loaded (no hardcoded "CIO/CTO"). If `defaultValues.target_contact_type` is provided it still wins.
- Loading: Select disabled, placeholder "Loading roles...".
- Empty list: Select disabled, placeholder "No buyer roles configured. Contact your admin."
- No other field touched, no restyling.

## 4. Remaining occurrences

Search found only these, all covered above plus one doc line:

- `README.md` line 45 — documents the old five-value select; updated to say the list comes from the company profile.
- `AdminBriefingEdit.tsx` line 171 — free-text input, left as-is per instruction.

## Constraints honored

No Postgres enum, no `briefings` schema change, no UI for editing `buyer_roles`.

On completion: list of files changed plus confirmation that the build and a TypeScript check pass clean.
