# WebTECH AI Sales Prep v2

Build a full-stack web app called “Inceed Call Prep AI” that generates a call-ready company briefing for recruiters and sales. The app has a two-step workflow. Step 1 generates a structured company briefing from company inputs and public web content. Step 2 optionally enriches the briefing for a specific person using a provided LinkedIn profile link and optional pasted LinkedIn text. Do not scrape LinkedIn. Only use what the user provides.

TECH STACK
- Next.js (App Router), TypeScript, Tailwind.
- Use Supabase for database, auth (email magic link is fine), and storage if needed.
- Use server-side API routes (or Supabase Edge Functions) for AI calls.
- Use structured outputs via JSON schema validation (zod).
- Provide a clean, modern UI with a simple internal tool vibe.

ROLES AND ACCESS
- This is an internal tool for Inceed team members.
- Require login to use the app (Supabase Auth).
- Add an admin toggle later, but for v1 just require auth.

PAGES
1) /login
- Email login (magic link). Minimal.

2) / (Dashboard)
- Title and short explanation.
- “New Briefing” button.
- List of recent briefings (last 20) with status, company name, created date, and “Open”.

3) /briefings/new
- Multi-step form UI.
- Step 1: Company Inputs form and Generate button.
- After generation succeeds, show a “Continue to Contact Enrichment” button.
- Step 2: Contact Enrichment form that runs a second AI call to generate contact-specific prep.

4) /briefings/[id]
- Displays the briefing in a structured layout with sections and copy buttons.
- If contact enrichment exists, show it as an additional tab.
- Include “Export” actions:
  - Copy as Markdown
  - Copy as CRM Notes (plain text)
  - Download JSON

PRIMARY USER FLOW
Step 1. Company Briefing
Inputs (required):
- company_name (text)
- company_url (url)
- target_contact_type (select: CIO/CTO, VP IT, Finance Leadership, HR/Talent, Executive Leadership)
Inputs (optional):
- industry (select with “Other” + free text)
- meeting_type (select: Intro call, Discovery, Follow-up)
- known_pain (textarea)
- region (text or select: Local, Regional, National, Remote-first)
- notes (textarea)

On submit:
- Validate URL format.
- Call backend endpoint POST /api/briefings/generate-company
- The backend should:
  1) Fetch and summarize the company website (light crawl):
     - Fetch homepage HTML and extract readable text.
     - Try to detect and fetch likely About page, Careers page, and Contact page if discoverable from nav links.
     - If fetch fails, continue with the user inputs only and mark confidence lower.
  2) Build a normalized “company_context” summary object.
  3) Call the LLM to produce a structured Company Briefing JSON (schema below).
  4) Save the briefing to the database.

Step 2. Contact Enrichment (optional follow-up)
Inputs:
- person_name (required for enrichment)
- person_title (optional)
- linkedin_url (required for enrichment)
- linkedin_text (optional paste. label: “Paste headline, about, or summary here if you want better accuracy.”)

Guardrails:
- Do not scrape LinkedIn.
- Only use the URL as an identifier plus any pasted text.
- If no pasted text, the AI must not claim specific experience history. It can only infer generic priorities from the person_title and contact type, and should label inferences as “likely”.

On submit:
- Call backend endpoint POST /api/briefings/generate-contact
- Backend calls LLM with the previously generated company briefing plus contact fields.
- Save enrichment output linked to the briefing.

DATABASE (Supabase)
Tables:

1) briefings
- id uuid pk
- user_id uuid (auth)
- company_name text not null
- company_url text not null
- target_contact_type text not null
- industry text null
- meeting_type text null
- known_pain text null
- region text null
- notes text null
- website_sources jsonb null (captured pages, URLs, fetch status)
- company_context jsonb null (normalized summary)
- company_briefing jsonb null (LLM output schema)
- company_briefing_md text null (generated markdown)
- status text not null default 'ready' (or 'failed')
- confidence_score numeric null (0-100)
- created_at timestamptz default now()
- updated_at timestamptz default now()

2) briefing_contacts
- id uuid pk
- briefing_id uuid fk -> briefings.id on delete cascade
- user_id uuid
- person_name text not null
- person_title text null
- linkedin_url text not null
- linkedin_text text null
- contact_enrichment jsonb null (LLM output schema)
- contact_enrichment_md text null
- created_at timestamptz default now()

Row Level Security:
- Only the owning user_id can read/write their records.

API ENDPOINTS
1) POST /api/briefings/generate-company
Input: company form fields.
Process:
- Fetch site pages with a simple fetch and readability extraction. Keep it shallow.
- Build context summary and pass to LLM.
- Validate LLM output with zod. If invalid, retry once with “fix to schema” instruction.
- Save briefing and return briefing_id.

2) POST /api/briefings/generate-contact
Input: briefing_id + contact fields.
Process:
- Load company briefing JSON from DB.
- Call LLM to generate contact enrichment JSON, validate, save, return.

3) GET /api/briefings/[id]
Return the stored JSON and markdown.

LLM INTEGRATION
- Use an environment variable for model provider key (OPENAI_API_KEY).
- Prefer a model that supports structured JSON output.
- Use temperature low (0.2 to 0.4).
- Always include: “If data is missing, state assumptions clearly and label as likely.”

STRUCTURED OUTPUT SCHEMAS

A) Company Briefing JSON schema (company_briefing)
{
  "company_snapshot": {
    "one_liner": "string",
    "industry": "string",
    "estimated_size": "string",
    "hq_or_region": "string",
    "what_they_sell": "string",
    "who_they_sell_to": "string",
    "notable_signals": ["string"]
  },
  "website_signals": {
    "pages_reviewed": [{"url":"string","type":"homepage|about|careers|contact|other","fetch_status":"ok|failed"}],
    "products_services": ["string"],
    "positioning_keywords": ["string"],
    "tech_stack_hints": ["string"],
    "hiring_signals": {
      "careers_page_found": "boolean",
      "role_families_seen": ["string"],
      "seniority_mix": "string",
      "remote_hybrid_signals": ["string"]
    }
  },
  "likely_hiring_and_gaps": [
    {
      "role_title": "string",
      "why_it_matters": "string",
      "difficulty_to_fill_stars": 1,
      "contract_vs_fte_likelihood": "string",
      "common_skills": ["string"]
    }
  ],
  "conversation_hooks": {
    "for_recruiter": ["string"],
    "for_sales": ["string"],
    "sample_opener_script": "string",
    "discovery_questions": ["string"],
    "red_flags_to_listen_for": ["string"]
  },
  "recommended_inceed_angle": {
    "primary_service_to_lead_with": "string",
    "why_this_fits": ["string"],
    "what_not_to_pitch_first": ["string"]
  },
  "assumptions_and_confidence": {
    "assumptions": ["string"],
    "confidence_score_0_100": 0
  }
}
Rules:
- difficulty_to_fill_stars is integer 1-5.
- likely_hiring_and_gaps should include 5 items if possible.
- If website fetch fails, reflect that in pages_reviewed and reduce confidence.

Also generate company_briefing_md as a readable markdown version that mirrors the structure and is easy to paste into CRM notes.

B) Contact Enrichment JSON schema (contact_enrichment)
{
  "contact_snapshot": {
    "person_name": "string",
    "person_title": "string",
    "linkedin_url": "string",
    "provided_linkedin_text_used": "boolean"
  },
  "role_influence_and_priorities": {
    "likely_top_priorities": ["string"],
    "how_they_measure_success": ["string"],
    "where_they_influence_hiring": ["string"]
  },
  "best_conversation_entry": {
    "best_opening_line": "string",
    "value_hypothesis": ["string"],
    "avoid_these_angles": ["string"]
  },
  "personalized_questions": ["string"],
  "personalized_followup_email": {
    "subject": "string",
    "body": "string"
  },
  "guardrails": {
    "no_scraping_statement": "string",
    "assumptions_labeled": "boolean"
  }
}
Rules:
- If linkedin_text is empty, do not claim specific career history. Use “likely” language.
- Always include a short statement confirming no scraping and that only provided inputs were used.

UI REQUIREMENTS
- Multi-step wizard with progress indicator.
- Loading states with helpful messages.
- Error state that shows what failed (website fetch, LLM validation).
- Copy buttons for each section.
- A “Regenerate” button for company briefing and for contact enrichment.
- Store the last inputs so the user can tweak and regenerate.

DESIGN
- You are a senior UI/UX designer. 
- Build a dark-themed landing page for a recruiting agency called “Inceed”, located in Tulsa, OK. 
- The site should feel very high-end but grounded — not a generic template but something special and different.
- Clean, modern, internal tool UI. Use cards, subtle borders, good spacing. Subtle motion on loading. 

SECURITY AND COMPLIANCE
- Do not scrape LinkedIn.
- Only process public website pages via normal fetch.
- Add a disclaimer in the UI: “AI-assisted briefing. Validate in discovery.”
- Log minimal telemetry. No sensitive data.

DELIVERABLE
- A working Lovable app with auth, database, the multi-step flow, and structured outputs stored and displayed.
- Include seed demo data only if easy. Otherwise skip.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/193f17d5-2f4a-4547-8051-f46375121cf2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
