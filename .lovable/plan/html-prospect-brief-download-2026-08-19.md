# HTML Prospect Brief Download

Add a "HTML Brief" button to the briefing detail page that downloads a single self-contained `.html` file — print-friendly (white page, dark text) with WebTECH amber accents.

## What the user gets

- A new button beside Markdown / CRM Notes / JSON / Word Doc on the briefing detail page.
- Clicking it downloads `<company>-brief.html`.
- The file opens in any browser with no internet or assets needed, and prints cleanly to PDF.

## Design

- Light print-friendly base: white background, near-black text, generous margins.
- Accent: amber `hsl(38 92% 50%)` for section headings, rules, badges, and star ratings — matching the app's primary token.
- Muted grey for labels/metadata, subtle card borders for gap and objection blocks.
- System font stack; `@media print` rules to remove shadows, keep page breaks off mid-section.

## Content sections

Mirrors the existing Word export, same order and data guards:

1. Header — company name, URL, generated date, confidence score badge
2. Qualification Assessment (score, positive signals, concerns, recommendation)
3. Company Snapshot
4. Website Signals / opportunity signals
5. Why They Need You
6. Identified Gaps (with star urgency + why it matters)
7. Conversation Hooks (first touch, live conversation, opener, discovery questions, red flags)
8. Recommended Angle
9. Common Objections and If They Ask
10. Contact enrichment (latest contact, when present)
11. Assumptions and confidence

Every array access uses optional chaining with empty-array fallback, and sections with no data are omitted — same resilience as the current briefing view.

## Technical

- New `src/lib/exportHtml.ts` exporting `exportBriefingToHtml(companyName, companyUrl, briefing, contact, createdAt)`.
  - Builds an HTML string with an inlined `<style>` block, escapes all interpolated values, creates a `Blob` of type `text/html`, and downloads via an object URL (same pattern as the JSON download).
  - No new dependencies.
- `src/pages/BriefingDetail.tsx`: add an outline button (FileCode icon) in the existing export button row, calling the new helper with the same args the Word export uses.

No backend, schema, or edge function changes.
