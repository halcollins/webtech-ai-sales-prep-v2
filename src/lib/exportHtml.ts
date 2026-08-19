import { CompanyBriefing, ContactEnrichment } from "./schemas";

const esc = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const stars = (n: number) => "★".repeat(Math.max(0, Math.min(5, n))) + "☆".repeat(Math.max(0, 5 - n));

const section = (title: string, body: string) =>
  body.trim() ? `<section class="section"><h2>${esc(title)}</h2>${body}</section>` : "";

const list = (items?: string[] | null, cls = "") =>
  items && items.length
    ? `<ul${cls ? ` class="${cls}"` : ""}>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`
    : "";

const field = (label: string, value?: string | null) =>
  value ? `<p class="field"><span class="label">${esc(label)}</span>${esc(value)}</p>` : "";

const sub = (label: string) => `<h3>${esc(label)}</h3>`;

const para = (text?: string | null, cls = "") =>
  text ? `<p${cls ? ` class="${cls}"` : ""}>${esc(text)}</p>` : "";

const STYLES = `
  :root {
    --accent: hsl(38 92% 50%);
    --accent-soft: hsl(38 92% 96%);
    --ink: #1a1a1e;
    --muted: #5f6068;
    --line: #e3e3e8;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 48px 32px;
    background: #ffffff;
    color: var(--ink);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 15px;
    line-height: 1.6;
  }
  main { max-width: 820px; margin: 0 auto; }
  header.brief-header { border-bottom: 3px solid var(--accent); padding-bottom: 20px; margin-bottom: 8px; }
  .eyebrow { text-transform: uppercase; letter-spacing: .14em; font-size: 11px; font-weight: 700; color: var(--accent); margin: 0 0 6px; }
  h1 { font-size: 30px; line-height: 1.2; margin: 0 0 10px; }
  .meta { color: var(--muted); font-size: 13px; margin: 0; }
  .meta a { color: var(--muted); }
  .badge { display: inline-block; margin-top: 12px; padding: 4px 12px; border-radius: 999px; background: var(--accent-soft); border: 1px solid var(--accent); color: #7a4c00; font-size: 12px; font-weight: 700; }
  .section { margin-top: 34px; page-break-inside: avoid; }
  h2 { font-size: 18px; margin: 0 0 12px; padding-bottom: 6px; border-bottom: 1px solid var(--line); }
  h3 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin: 18px 0 6px; }
  p { margin: 0 0 10px; }
  ul { margin: 0 0 12px; padding-left: 20px; }
  li { margin-bottom: 4px; }
  .field .label { font-weight: 700; margin-right: 6px; }
  .lead { font-size: 17px; font-style: italic; color: #34343a; }
  .card { border: 1px solid var(--line); border-left: 3px solid var(--accent); border-radius: 6px; padding: 14px 16px; margin-bottom: 12px; page-break-inside: avoid; }
  .card h4 { margin: 0 0 6px; font-size: 15px; }
  .stars { color: var(--accent); letter-spacing: 2px; font-size: 13px; margin-left: 8px; }
  .quote { border-left: 3px solid var(--accent); background: var(--accent-soft); padding: 12px 16px; font-style: italic; border-radius: 0 6px 6px 0; }
  footer { margin-top: 44px; padding-top: 16px; border-top: 1px solid var(--line); color: var(--muted); font-size: 12px; }
  @media print {
    body { padding: 0; font-size: 12pt; }
    .section { break-inside: avoid; }
    a { text-decoration: none; color: inherit; }
  }
`;

export function buildBriefingHtml(
  companyName: string,
  companyUrl: string,
  briefing: CompanyBriefing,
  contact?: ContactEnrichment | null,
  createdAt?: string
): string {
  const parts: string[] = [];

  const confidence = briefing.assumptions_and_confidence?.confidence_score_0_100;

  parts.push(`
    <header class="brief-header">
      <p class="eyebrow">Prospect Brief</p>
      <h1>${esc(companyName)}</h1>
      <p class="meta">
        <a href="${esc(companyUrl)}">${esc(companyUrl)}</a>
        ${createdAt ? ` &middot; Generated ${esc(new Date(createdAt).toLocaleDateString())}` : ""}
      </p>
      ${typeof confidence === "number" ? `<span class="badge">Confidence ${esc(confidence)}%</span>` : ""}
    </header>
  `);

  // Qualification Assessment
  const qa = briefing.qualification_assessment;
  if (qa) {
    parts.push(
      section(
        "Qualification Assessment",
        [
          field("Score", qa.score),
          (qa.positive_signals ?? []).length ? sub("Positive Signals") + list(qa.positive_signals) : "",
          (qa.concerns ?? []).length ? sub("Concerns") + list(qa.concerns) : "",
          qa.recommendation ? sub("Recommendation") + para(qa.recommendation) : "",
        ].join("")
      )
    );
  }

  // Company Snapshot
  const snap = briefing.company_snapshot;
  if (snap) {
    parts.push(
      section(
        "Company Snapshot",
        [
          para(snap.one_liner, "lead"),
          field("Industry", snap.industry),
          field("Size", snap.estimated_size),
          field("Location", snap.hq_or_region),
          field("What They Sell", snap.what_they_sell),
          field("Who They Sell To", snap.who_they_sell_to),
          (snap.notable_signals ?? []).length ? sub("Notable Signals") + list(snap.notable_signals) : "",
        ].join("")
      )
    );
  }

  // Website Signals
  const ws = briefing.website_signals;
  if (ws) {
    parts.push(
      section(
        "Website Signals",
        [
          (ws.products_services ?? []).length ? sub("Products & Services") + list(ws.products_services) : "",
          (ws.positioning_keywords ?? []).length
            ? sub("Positioning Keywords") + list(ws.positioning_keywords)
            : "",
          (ws.tech_stack_hints ?? []).length ? sub("Tech Stack Hints") + list(ws.tech_stack_hints) : "",
          (ws.opportunity_signals?.signals_matched ?? []).length
            ? sub("Opportunity Signals") + list(ws.opportunity_signals?.signals_matched)
            : "",
          ws.opportunity_signals?.content_freshness
            ? field("Content Freshness", ws.opportunity_signals.content_freshness)
            : "",
          (ws.opportunity_signals?.notable_absences ?? []).length
            ? sub("Notable Absences") + list(ws.opportunity_signals?.notable_absences)
            : "",
        ].join("")
      )
    );
  }

  // AI & Technology Investments
  const ati = briefing.ai_technology_investments;
  if (ati) {
    parts.push(
      section(
        "AI & Technology Investments",
        [
          (ati.major_investments ?? []).length
            ? sub("Major Investments") +
              (ati.major_investments ?? [])
                .map(
                  (inv) =>
                    `<div class="card"><h4>${esc(inv.name)}${inv.value ? ` &middot; ${esc(inv.value)}` : ""}</h4>${
                      inv.date ? `<p class="meta">${esc(inv.date)}</p>` : ""
                    }${para(inv.significance)}</div>`
                )
                .join("")
            : "",
          (ati.internal_capabilities ?? []).length
            ? sub("Internal Capabilities") +
              list((ati.internal_capabilities ?? []).map((c) => `${c.name}: ${c.description}`))
            : "",
          ati.strategic_positioning ? sub("Strategic Positioning") + para(ati.strategic_positioning) : "",
          ati.why_it_matters ? sub("Why It Matters") + para(ati.why_it_matters) : "",
        ].join("")
      )
    );
  }

  // Recent News
  const news = briefing.recent_news?.items ?? [];
  if (news.length) {
    parts.push(
      section(
        "Recent News That Matters",
        news
          .map(
            (item) =>
              `<div class="card"><h4>${esc(item.news_item)}</h4><p class="field"><span class="label">Why it matters</span>${esc(
                item.why_it_matters
              )}</p></div>`
          )
          .join("")
      )
    );
  }

  // Why They Need You
  const wtn = briefing.why_they_need_you;
  if (wtn) {
    parts.push(
      section(
        "Why They Need Us",
        [
          wtn.pain_point_explanation ? sub("Pain Point") + para(wtn.pain_point_explanation) : "",
          wtn.business_context ? sub("Business Context") + para(wtn.business_context) : "",
          wtn.value_connection ? sub("Our Value") + para(wtn.value_connection) : "",
        ].join("")
      )
    );
  }

  // Identified Gaps
  const gaps = briefing.identified_gaps ?? [];
  if (gaps.length) {
    parts.push(
      section(
        "Identified Gaps",
        gaps
          .map(
            (gap) => `<div class="card">
              <h4>${esc(gap.gap_title)}<span class="stars">${stars(gap.urgency_stars ?? 0)}</span></h4>
              ${para(gap.why_it_matters)}
              ${field("Addressed by", gap.addressed_by_offering)}
              ${(gap.supporting_evidence ?? []).length ? field("Evidence", (gap.supporting_evidence ?? []).join(", ")) : ""}
            </div>`
          )
          .join("")
      )
    );
  }

  // Recommended Angle
  const angle = briefing.recommended_angle;
  if (angle) {
    parts.push(
      section(
        "Recommended Approach",
        [
          field("Lead With", angle.primary_service_to_lead_with),
          (angle.why_this_fits ?? []).length ? sub("Why This Fits") + list(angle.why_this_fits) : "",
          (angle.what_not_to_pitch_first ?? []).length
            ? sub("What Not to Pitch First") + list(angle.what_not_to_pitch_first)
            : "",
        ].join("")
      )
    );
  }

  // Conversation Guide
  const hooks = briefing.conversation_hooks;
  if (hooks) {
    parts.push(
      section(
        "Conversation Guide",
        [
          hooks.sample_opener_script
            ? sub("Sample Opener") + `<p class="quote">&ldquo;${esc(hooks.sample_opener_script)}&rdquo;</p>`
            : "",
          (hooks.discovery_questions ?? []).length
            ? sub("Discovery Questions") +
              `<ol>${(hooks.discovery_questions ?? []).map((q) => `<li>${esc(q)}</li>`).join("")}</ol>`
            : "",
          (hooks.for_first_touch ?? []).length ? sub("First Touch") + list(hooks.for_first_touch) : "",
          (hooks.for_live_conversation ?? []).length
            ? sub("Live Conversation") + list(hooks.for_live_conversation)
            : "",
          (hooks.red_flags_to_listen_for ?? []).length
            ? sub("Red Flags to Listen For") + list(hooks.red_flags_to_listen_for)
            : "",
        ].join("")
      )
    );
  }

  // Objections
  const objections = briefing.common_objections ?? [];
  if (objections.length) {
    parts.push(
      section(
        "Objection Handling",
        objections
          .map(
            (obj) => `<div class="card">
              <h4>&ldquo;${esc(obj.objection)}&rdquo;</h4>
              ${field("Why they say this", obj.why_they_say_this)}
              ${field("Response", obj.suggested_response)}
            </div>`
          )
          .join("")
      )
    );
  }

  // If They Ask
  const faq = briefing.if_they_ask ?? [];
  if (faq.length) {
    parts.push(
      section(
        "Quick Reference FAQ",
        faq
          .map(
            (f) => `<div class="card"><h4>${esc(f.question)}</h4>${para(f.answer_framework)}</div>`
          )
          .join("")
      )
    );
  }

  // Contact
  if (contact) {
    const cs = contact.contact_snapshot;
    const bcc = contact.background_career_context;
    const rip = contact.role_influence_and_priorities;
    const bce = contact.best_conversation_entry;
    const email = contact.personalized_followup_email;

    parts.push(
      section(
        `Contact: ${cs?.person_name ?? ""}`,
        [
          field("Title", cs?.person_title),
          cs?.linkedin_url
            ? `<p class="field"><span class="label">LinkedIn</span><a href="${esc(cs.linkedin_url)}">${esc(
                cs.linkedin_url
              )}</a></p>`
            : "",
          bcc?.location ? field("Location", bcc.location) : "",
          bcc?.education ? field("Education", bcc.education) : "",
          (bcc?.career_history ?? []).length
            ? sub("Career History") +
              list((bcc?.career_history ?? []).map((h) => `${h.title} — ${h.company} (${h.tenure})`))
            : "",
          bcc?.professional_reputation
            ? sub("Professional Reputation") + para(bcc.professional_reputation)
            : "",
          (bcc?.conversation_hooks ?? []).length
            ? sub("Personal Hooks") + list(bcc?.conversation_hooks)
            : "",
          (rip?.likely_top_priorities ?? []).length
            ? sub("Likely Top Priorities") + list(rip?.likely_top_priorities)
            : "",
          (rip?.how_they_measure_success ?? []).length
            ? sub("How They Measure Success") + list(rip?.how_they_measure_success)
            : "",
          (rip?.where_they_influence_hiring ?? []).length
            ? sub("Where They Influence Decisions") + list(rip?.where_they_influence_hiring)
            : "",
          bce?.best_opening_line
            ? sub("Best Opening Line") + `<p class="quote">&ldquo;${esc(bce.best_opening_line)}&rdquo;</p>`
            : "",
          (bce?.value_hypothesis ?? []).length ? sub("Value Hypothesis") + list(bce?.value_hypothesis) : "",
          (bce?.avoid_these_angles ?? []).length ? sub("Avoid These Angles") + list(bce?.avoid_these_angles) : "",
          (contact.personalized_questions ?? []).length
            ? sub("Personalized Questions") + list(contact.personalized_questions)
            : "",
          email
            ? sub("Suggested Follow-up Email") +
              `<div class="card">${field("Subject", email.subject)}<p>${esc(email.body).replace(
                /\n/g,
                "<br />"
              )}</p></div>`
            : "",
        ].join("")
      )
    );
  }

  // Assumptions
  const ac = briefing.assumptions_and_confidence;
  if (ac && (ac.assumptions ?? []).length) {
    parts.push(section("Assumptions", list(ac.assumptions)));
  }

  parts.push(
    `<footer>Generated by WebTECH Sales Prep AI. Research is AI-assisted — verify key facts before the call.</footer>`
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Prospect Brief: ${esc(companyName)}</title>
<style>${STYLES}</style>
</head>
<body>
<main>${parts.join("\n")}</main>
</body>
</html>`;
}

export function exportBriefingToHtml(
  companyName: string,
  companyUrl: string,
  briefing: CompanyBriefing,
  contact?: ContactEnrichment | null,
  createdAt?: string
) {
  const html = buildBriefingHtml(companyName, companyUrl, briefing, contact, createdAt);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${companyName.replace(/\s+/g, "-").toLowerCase()}-brief.html`;
  a.click();
  URL.revokeObjectURL(url);
}
