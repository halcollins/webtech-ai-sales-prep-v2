# Stage A: Generalize the briefing engine to a seller profile

Move the seller identity (currently hardcoded as Inceed, an IT staffing firm) into a single-row `company_profile` table that both AI edge functions read at request time. No sections dropped, no layout changes, no restyling.

## Part 1 - `company_profile` table

Migration creating `public.company_profile` with the exact columns specified (including the unused `org_id`), a unique constraint on `singleton` plus a `CHECK (singleton = true)`, GRANTs, RLS enabled, and policies matching the style used on `briefings`:

- SELECT for any authenticated user
- INSERT / UPDATE / DELETE restricted to `private.has_role(auth.uid(), 'admin')`

Seed the single Moxxy Marketing row with the supplied placeholder values, `ai_model = 'google/gemini-3.6-flash'`, `bot_user_agent = 'MoxxyPrepBot/1.0'`.

`src/integrations/supabase/types.ts` gets the new table added so TypeScript stays accurate.

## Part 2 - Rename the seller-specific schema fields

In `supabase/functions/generate-company-briefing/index.ts`, `COMPANY_BRIEFING_SCHEMA` renames only — every type and shape preserved:

| Old | New |
| --- | --- |
| `why_they_need_staffing` | `why_they_need_you` |
| `. inceed_value_connection` | `. value_connection` |
| `recommended_inceed_angle` | `recommended_angle` |
| `new_rep_faq` | `if_they_ask` |
| `likely_hiring_and_gaps` | `identified_gaps` |
| `. role_title` | `. gap_title` |
| `. difficulty_to_fill_stars` | `. urgency_stars` |
| `. contract_vs_fte_likelihood` | `. addressed_by_offering` |
| `. common_skills` | `. supporting_evidence` |
| `conversation_hooks.for_recruiter` | `. for_first_touch` |
| `conversation_hooks.for_sales` | `. for_live_conversation` |

`website_signals.hiring_signals` is replaced wholesale by `opportunity_signals` (`signals_matched` string[], `content_freshness` string, `notable_absences` string[]). All `required` arrays updated, including the top-level one.

## Part 3 - Profile-driven prompt

- Load the single `company_profile` row with the service-role client before prompt construction; if absent, return 500 with "No company profile configured. An admin must set one up before briefings can be generated." No defaults fallback.
- Rebuild the system prompt entirely from profile data: persona keyed off `rep_experience_level` (experienced = no category education), seller identity, offering menu, trigger-signal hunting into `signals_matched`, disqualifiers pushing the qualification score down and into concerns, proof points as the only citable results, price range, seeded objections and FAQs (model may add inferred ones), competitors as alternatives, banned-words prohibition, `identified_gaps` rules (urgency 1-5, `addressed_by_offering` must map to a `what_we_sell` item, evidence cited from the site), `recommended_angle.primary_service_to_lead_with` constrained to `what_we_sell`, and the existing assumptions + confidence instruction.
- Model string becomes `profile.ai_model`.
- All four `InceedBot/1.0` User-Agents become `Mozilla/5.0 (compatible; ${profile.bot_user_agent})`.

## Part 4 - Page discovery

In `fetchWebsiteContent`, the about fetch is untouched. The careers lookup is replaced by two lookups following the identical pattern (isAllowedUrl, 10s AbortController, same stripping, same char cap, same error handling):

- services: `(services|solutions|what-we-do|products)`
- news: `(blog|news|insights|resources|case-stud)`

labelled `"services"` and `"news"` in `pages`. SSRF validation unchanged. The `pages_reviewed.type` enum gains these two values so the model can report them.

## Part 5 - Contact enrichment

Same profile load and 500 guard; system prompt rewritten around `company_name`, `what_we_sell`, `who_we_serve` with recruiting framing removed; hardcoded offerings sentence replaced by `what_we_sell`; model string from `profile.ai_model`. The Perplexity `sonar` call is untouched.

## Part 6 - Downstream updates

- `src/lib/schemas.ts` — Zod `companyBriefingSchema` mirrors every Part 2 rename.
- `generateMarkdown` — renamed references, "How We Help", "Recommended Angle", "First Touch" / "Live Conversation" headings, careers/seniority lines replaced by the `opportunity_signals` fields.
- `BriefingDisplay.tsx` — renames and section labels only; card structure, layout and styling untouched.
- `exportWord.ts` — renames plus "Why They Need Us" and "Value Connection:".
- `staffing_implication` -> `why_it_matters` everywhere it appears: `src/lib/schemas.ts` (2), `BriefingDisplay.tsx` (3), `exportWord.ts` (3), with the exported label changed from "Staffing Implication:" to "Why It Matters:". `ai_technology_investments` and `recent_news` stay exactly as they are — optional and ungenerated; they are not added to the edge function schema or prompt in this stage.

- `Dashboard.tsx` — "AI-powered company research for sales teams".
- `CompanyForm.tsx` — "What made you think they might be a fit?".
- Codebase sweep for remaining "Inceed / staffing / recruiter / recruiting" strings: the `src/index.css` theme comment and the `recommended_inceed_angle` reference in `BriefingDetail.tsx` line 205 (a CRM-copy string builder, not admin visibility logic) are the two extras found. Repo, project and table names unchanged.

## Part 7 - Null byte guard

A recursive `stripNullBytes` helper in each edge function, applied to `companyBriefing` and `briefingMd` before the `briefings` insert, and to the enrichment payload before its insert — avoiding Postgres 22P05.

## Scope note on BriefingDetail.tsx

Only the `recommended_inceed_angle` reference inside the CRM copy string builder (line 205) is touched. The admin visibility logic in that file is left exactly as-is.

## Out of scope (explicit)

- No UI for `company_profile` — no setup wizard, admin editor, settings screen, or form. The single row is managed in the backend dashboard.
- No `rep_profiles` table or any per-user profile concept.
- No outreach generation: no email drafts, subject lines, call scripts, or voicemail scripts.
- No structural change to `briefings` or `briefing_contacts` — no new or altered columns.
- No change to existing RLS policies on `briefings`, `briefing_contacts`, `user_roles`, or `profiles`. Only new policies for `company_profile`.
- No change to authentication, routing, `App.tsx`, `ProtectedRoute`, `AdminProtectedRoute`, or anything under `src/pages/admin/`.
- `ai_technology_investments` and `recent_news` are not added to the edge function schema or prompt.
- No restyling, redesign, or reorganization of any component.

On completion I will report every file changed and confirm that the build and a TypeScript check both pass with no errors.




## Technical notes

- Both edge functions already build a service-role client; the profile read reuses it, so no new secrets.
- The profile is fetched per request, so dashboard edits take effect on the next briefing with no redeploy.
- Renames are mechanical and type-preserving, so the frontend needs no structural change; a typecheck plus a build will confirm full coverage.
