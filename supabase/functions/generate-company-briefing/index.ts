import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const companyInputSchema = z.object({
  company_name: z.string().min(1, "Company name is required").max(200, "Company name too long"),
  company_url: z
    .string()
    .url("Invalid URL format")
    .refine((url) => {
      try {
        const parsed = new URL(url);
        return ["http:", "https:"].includes(parsed.protocol);
      } catch {
        return false;
      }
    }, "Only HTTP(S) URLs allowed"),
  target_contact_type: z.enum(["CIO/CTO", "VP IT", "Finance Leadership", "HR/Talent", "Executive Leadership"]),
  lead_source: z
    .enum(["Job board posting", "LinkedIn search", "Referral", "News/article", "Industry list", "Other"])
    .optional()
    .nullable(),
  initial_interest: z.string().max(2000).optional().nullable(),
  industry: z.string().max(200).optional().nullable(),
  meeting_type: z.string().max(200).optional().nullable(),
  known_pain: z.string().max(2000).optional().nullable(),
  region: z.string().max(200).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

// SSRF protection - block private/internal IPs and dangerous protocols
function isPrivateIPv4(hostname: string): boolean {
  const ipMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!ipMatch) return false;

  const [, a, b, c, d] = ipMatch.map(Number);

  // Validate octets are in valid range
  if (a > 255 || b > 255 || c > 255 || d > 255) return true; // Invalid = block

  // 10.0.0.0/8 - Private
  if (a === 10) return true;

  // 127.0.0.0/8 - Loopback
  if (a === 127) return true;

  // 0.0.0.0/8 - Invalid/broadcast
  if (a === 0) return true;

  // 172.16.0.0/12 - Private (172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 - Private
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 - Link-local / Cloud metadata
  if (a === 169 && b === 254) return true;

  // 224.0.0.0/4 - Multicast
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 - Reserved
  if (a >= 240) return true;

  return false;
}

function isPrivateIPv6(hostname: string): boolean {
  // Remove brackets if present (e.g., [::1])
  const cleanHostname = hostname.replace(/^\[|\]$/g, "");

  // Check for IPv6 patterns
  const lowerHostname = cleanHostname.toLowerCase();

  // ::1 - Loopback
  if (lowerHostname === "::1" || lowerHostname === "0:0:0:0:0:0:0:1") return true;

  // :: - Unspecified address
  if (lowerHostname === "::" || lowerHostname === "0:0:0:0:0:0:0:0") return true;

  // fc00::/7 - Unique local addresses (fc00:: to fdff::)
  if (lowerHostname.startsWith("fc") || lowerHostname.startsWith("fd")) return true;

  // fe80::/10 - Link-local addresses
  if (
    lowerHostname.startsWith("fe8") ||
    lowerHostname.startsWith("fe9") ||
    lowerHostname.startsWith("fea") ||
    lowerHostname.startsWith("feb")
  )
    return true;

  // ff00::/8 - Multicast
  if (lowerHostname.startsWith("ff")) return true;

  return false;
}

function isDangerousHostname(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();

  // Block localhost and common local aliases
  if (
    lowerHostname === "localhost" ||
    lowerHostname === "localhost.localdomain" ||
    lowerHostname.endsWith(".localhost") ||
    lowerHostname.endsWith(".local") ||
    lowerHostname.endsWith(".internal")
  ) {
    return true;
  }

  // Block common cloud metadata endpoints
  const metadataHostnames = ["metadata.google.internal", "metadata.goog", "instance-data"];
  if (metadataHostnames.some((m) => lowerHostname === m || lowerHostname.endsWith("." + m))) {
    return true;
  }

  return false;
}

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Explicit protocol whitelist - MUST be http or https
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      console.log("Blocked non-HTTP(S) protocol:", parsed.protocol);
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block dangerous hostnames
    if (isDangerousHostname(hostname)) {
      console.log("Blocked dangerous hostname:", hostname);
      return false;
    }

    // Block private IPv4 addresses
    if (isPrivateIPv4(hostname)) {
      console.log("Blocked private IPv4:", hostname);
      return false;
    }

    // Block private IPv6 addresses
    if (isPrivateIPv6(hostname)) {
      console.log("Blocked private IPv6:", hostname);
      return false;
    }

    return true;
  } catch (e) {
    console.error("URL parsing error:", e);
    return false;
  }
}

const COMPANY_BRIEFING_SCHEMA = {
  type: "object",
  properties: {
    company_snapshot: {
      type: "object",
      properties: {
        one_liner: { type: "string" },
        industry: { type: "string" },
        estimated_size: { type: "string" },
        hq_or_region: { type: "string" },
        what_they_sell: { type: "string" },
        who_they_sell_to: { type: "string" },
        notable_signals: { type: "array", items: { type: "string" } },
      },
      required: [
        "one_liner",
        "industry",
        "estimated_size",
        "hq_or_region",
        "what_they_sell",
        "who_they_sell_to",
        "notable_signals",
      ],
    },
    website_signals: {
      type: "object",
      properties: {
        pages_reviewed: {
          type: "array",
          items: {
            type: "object",
            properties: {
              url: { type: "string" },
              type: { type: "string", enum: ["homepage", "about", "services", "news", "careers", "contact", "team", "other"] },
              fetch_status: { type: "string", enum: ["ok", "failed"] },
            },
            required: ["url", "type", "fetch_status"],
          },
        },
        products_services: { type: "array", items: { type: "string" } },
        positioning_keywords: { type: "array", items: { type: "string" } },
        tech_stack_hints: { type: "array", items: { type: "string" } },
        opportunity_signals: {
          type: "object",
          properties: {
            signals_matched: { type: "array", items: { type: "string" } },
            content_freshness: { type: "string" },
            notable_absences: { type: "array", items: { type: "string" } },
          },
          required: ["signals_matched", "content_freshness", "notable_absences"],
        },
      },
      required: ["pages_reviewed", "products_services", "positioning_keywords", "tech_stack_hints", "opportunity_signals"],
    },
    // NEW: Qualification Assessment
    qualification_assessment: {
      type: "object",
      properties: {
        score: { type: "string", enum: ["Strong fit", "Possible fit", "Needs validation", "Likely not a fit"] },
        positive_signals: { type: "array", items: { type: "string" } },
        concerns: { type: "array", items: { type: "string" } },
        recommendation: { type: "string" },
      },
      required: ["score", "positive_signals", "concerns", "recommendation"],
    },
    // NEW: Why They Need You
    why_they_need_you: {
      type: "object",
      properties: {
        pain_point_explanation: { type: "string" },
        business_context: { type: "string" },
        value_connection: { type: "string" },
      },
      required: ["pain_point_explanation", "business_context", "value_connection"],
    },
    // NEW: Common Objections
    common_objections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          objection: { type: "string" },
          why_they_say_this: { type: "string" },
          suggested_response: { type: "string" },
        },
        required: ["objection", "why_they_say_this", "suggested_response"],
      },
    },
    // NEW: If They Ask
    if_they_ask: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          answer_framework: { type: "string" },
        },
        required: ["question", "answer_framework"],
      },
    },
    identified_gaps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          gap_title: { type: "string" },
          why_it_matters: { type: "string" },
          urgency_stars: { type: "number", minimum: 1, maximum: 5 },
          addressed_by_offering: { type: "string" },
          supporting_evidence: { type: "array", items: { type: "string" } },
        },
        required: [
          "gap_title",
          "why_it_matters",
          "urgency_stars",
          "addressed_by_offering",
          "supporting_evidence",
        ],
      },
    },
    conversation_hooks: {
      type: "object",
      properties: {
        for_first_touch: { type: "array", items: { type: "string" } },
        for_live_conversation: { type: "array", items: { type: "string" } },
        sample_opener_script: { type: "string" },
        discovery_questions: { type: "array", items: { type: "string" } },
        red_flags_to_listen_for: { type: "array", items: { type: "string" } },
      },
      required: [
        "for_first_touch",
        "for_live_conversation",
        "sample_opener_script",
        "discovery_questions",
        "red_flags_to_listen_for",
      ],
    },
    recommended_angle: {
      type: "object",
      properties: {
        primary_service_to_lead_with: { type: "string" },
        why_this_fits: { type: "array", items: { type: "string" } },
        what_not_to_pitch_first: { type: "array", items: { type: "string" } },
      },
      required: ["primary_service_to_lead_with", "why_this_fits", "what_not_to_pitch_first"],
    },
    assumptions_and_confidence: {
      type: "object",
      properties: {
        assumptions: { type: "array", items: { type: "string" } },
        confidence_score_0_100: { type: "number", minimum: 0, maximum: 100 },
      },
      required: ["assumptions", "confidence_score_0_100"],
    },
  },
  required: [
    "company_snapshot",
    "website_signals",
    "qualification_assessment",
    "why_they_need_you",
    "common_objections",
    "if_they_ask",
    "identified_gaps",
    "conversation_hooks",
    "recommended_angle",
    "assumptions_and_confidence",
  ],
};

async function fetchWebsiteContent(
  url: string,
  botUserAgent: string,
): Promise<{ content: string; pages: any[]; success: boolean }> {
  const pages: any[] = [];
  let combinedContent = "";
  const userAgent = `Mozilla/5.0 (compatible; ${botUserAgent})`;

  // Validate URL before fetching
  if (!isAllowedUrl(url)) {
    console.error("URL blocked by SSRF protection:", url);
    pages.push({ url, type: "homepage", fetch_status: "failed" });
    return { content: "", pages, success: false };
  }

  try {
    // Set up timeout for fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    // Fetch homepage
    const homeResponse = await fetch(url, {
      headers: { "User-Agent": userAgent },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (homeResponse.ok) {
      const html = await homeResponse.text();

      // Limit response size (1MB max)
      if (html.length > 1024 * 1024) {
        console.warn("Homepage content too large, truncating");
      }

      // Extract text content (basic extraction)
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 15000); // Limit content length

      combinedContent += `HOMEPAGE:\n${textContent}\n\n`;
      pages.push({ url, type: "homepage", fetch_status: "ok" });

      // Try to find and fetch About page
      const aboutMatch = html.match(/href=["']([^"']*(?:about|company|who-we-are)[^"']*)["']/i);
      if (aboutMatch) {
        try {
          const aboutUrl = new URL(aboutMatch[1], url).href;

          // Validate discovered URL too
          if (isAllowedUrl(aboutUrl)) {
            const aboutController = new AbortController();
            const aboutTimeoutId = setTimeout(() => aboutController.abort(), 10000);

            const aboutResponse = await fetch(aboutUrl, {
              headers: { "User-Agent": userAgent },
              signal: aboutController.signal,
            });

            clearTimeout(aboutTimeoutId);

            if (aboutResponse.ok) {
              const aboutHtml = await aboutResponse.text();
              const aboutText = aboutHtml
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 10000);
              combinedContent += `ABOUT PAGE:\n${aboutText}\n\n`;
              pages.push({ url: aboutUrl, type: "about", fetch_status: "ok" });
            }
          }
        } catch (e) {
          console.log("Failed to fetch about page:", e);
        }
      }

      // Try to find and fetch Services page
      const servicesMatch = html.match(/href=["']([^"']*(?:services|solutions|what-we-do|products)[^"']*)["']/i);
      if (servicesMatch) {
        try {
          const servicesUrl = new URL(servicesMatch[1], url).href;

          // Validate discovered URL too
          if (isAllowedUrl(servicesUrl)) {
            const servicesController = new AbortController();
            const servicesTimeoutId = setTimeout(() => servicesController.abort(), 10000);

            const servicesResponse = await fetch(servicesUrl, {
              headers: { "User-Agent": userAgent },
              signal: servicesController.signal,
            });

            clearTimeout(servicesTimeoutId);

            if (servicesResponse.ok) {
              const servicesHtml = await servicesResponse.text();
              const servicesText = servicesHtml
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 10000);
              combinedContent += `SERVICES PAGE:\n${servicesText}\n\n`;
              pages.push({ url: servicesUrl, type: "services", fetch_status: "ok" });
            }
          }
        } catch (e) {
          console.log("Failed to fetch services page:", e);
        }
      }

      // Try to find and fetch News/Blog page
      const newsMatch = html.match(/href=["']([^"']*(?:blog|news|insights|resources|case-stud)[^"']*)["']/i);
      if (newsMatch) {
        try {
          const newsUrl = new URL(newsMatch[1], url).href;

          // Validate discovered URL too
          if (isAllowedUrl(newsUrl)) {
            const newsController = new AbortController();
            const newsTimeoutId = setTimeout(() => newsController.abort(), 10000);

            const newsResponse = await fetch(newsUrl, {
              headers: { "User-Agent": userAgent },
              signal: newsController.signal,
            });

            clearTimeout(newsTimeoutId);

            if (newsResponse.ok) {
              const newsHtml = await newsResponse.text();
              const newsText = newsHtml
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 10000);
              combinedContent += `NEWS PAGE:\n${newsText}\n\n`;
              pages.push({ url: newsUrl, type: "news", fetch_status: "ok" });
            }
          }
        } catch (e) {
          console.log("Failed to fetch news page:", e);
        }
      }


      // Try to find and fetch Team/Leadership page
      const teamMatch = html.match(
        /href=["']([^"']*[\/\-](?:team|leadership|people|meet-the-team|our-team|executives|management|leaders)[^"']*)["']/i,
      );
      if (teamMatch) {
        try {
          const teamUrl = new URL(teamMatch[1], url).href;

          if (isAllowedUrl(teamUrl)) {
            const teamController = new AbortController();
            const teamTimeoutId = setTimeout(() => teamController.abort(), 10000);

            const teamResponse = await fetch(teamUrl, {
              headers: { "User-Agent": userAgent },
              signal: teamController.signal,
            });

            clearTimeout(teamTimeoutId);

            if (teamResponse.ok) {
              const teamHtml = await teamResponse.text();
              const teamText = teamHtml
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 10000);
              combinedContent += `TEAM PAGE:\n${teamText}\n\n`;
              pages.push({ url: teamUrl, type: "team", fetch_status: "ok" });
            }
          }
        } catch (e) {
          console.log("Failed to fetch team page:", e);
        }
      }

      return { content: combinedContent, pages, success: true };
    } else {
      pages.push({ url, type: "homepage", fetch_status: "failed" });
      return { content: "", pages, success: false };
    }
  } catch (error) {
    console.error("Error fetching website:", error);
    pages.push({ url, type: "homepage", fetch_status: "failed" });
    return { content: "", pages, success: false };
  }
}

function generateMarkdown(briefing: any): string {
  let md = `# Company Briefing: ${briefing.company_snapshot.one_liner}

## Company Snapshot
- **Industry:** ${briefing.company_snapshot.industry}
- **Size:** ${briefing.company_snapshot.estimated_size}
- **Location:** ${briefing.company_snapshot.hq_or_region}
- **What They Sell:** ${briefing.company_snapshot.what_they_sell}
- **Target Customers:** ${briefing.company_snapshot.who_they_sell_to}

### Notable Signals
${briefing.company_snapshot.notable_signals.map((s: string) => `- ${s}`).join("\n")}

## Qualification Assessment
**Score:** ${briefing.qualification_assessment.score}

### Positive Signals
${briefing.qualification_assessment.positive_signals.map((s: string) => `✓ ${s}`).join("\n")}

### Concerns
${briefing.qualification_assessment.concerns.map((c: string) => `⚠️ ${c}`).join("\n")}

### Recommendation
${briefing.qualification_assessment.recommendation}

## Why They Need Us

### The Pain Point
${briefing.why_they_need_you.pain_point_explanation}

### Business Context
${briefing.why_they_need_you.business_context}

### How We Help
${briefing.why_they_need_you.value_connection}

## If They Push Back...
${briefing.common_objections
  .map(
    (obj: any) => `
### "${obj.objection}"
**Why they say this:** ${obj.why_they_say_this}

**Try this:** ${obj.suggested_response}
`,
  )
  .join("")}

## If They Ask...
${briefing.new_rep_faq
  .map(
    (faq: any) => `
**${faq.question}**
${faq.answer_framework}
`,
  )
  .join("")}

## Website Signals

### Products & Services
${briefing.website_signals.products_services.map((p: string) => `- ${p}`).join("\n")}

### Positioning Keywords
${briefing.website_signals.positioning_keywords.join(", ")}

### Tech Stack Hints
${briefing.website_signals.tech_stack_hints.join(", ")}

### Hiring Signals
- Careers Page Found: ${briefing.website_signals.hiring_signals.careers_page_found ? "Yes" : "No"}
- Seniority Mix: ${briefing.website_signals.hiring_signals.seniority_mix}
- Role Families: ${briefing.website_signals.hiring_signals.role_families_seen.join(", ")}
- Remote/Hybrid: ${briefing.website_signals.hiring_signals.remote_hybrid_signals.join(", ")}

## Likely Hiring & Gaps
${briefing.likely_hiring_and_gaps
  .map(
    (role: any) => `
### ${role.role_title} (${"★".repeat(role.difficulty_to_fill_stars)}${"☆".repeat(5 - role.difficulty_to_fill_stars)})
- **Why It Matters:** ${role.why_it_matters}
- **Contract vs FTE:** ${role.contract_vs_fte_likelihood}
- **Common Skills:** ${role.common_skills.join(", ")}
`,
  )
  .join("")}

## Conversation Hooks

### Sample Opener
> "${briefing.conversation_hooks.sample_opener_script}"

### For Recruiter
${briefing.conversation_hooks.for_recruiter.map((h: string) => `- ${h}`).join("\n")}

### For Sales
${briefing.conversation_hooks.for_sales.map((h: string) => `- ${h}`).join("\n")}

### Discovery Questions
${briefing.conversation_hooks.discovery_questions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}

### Red Flags to Listen For
${briefing.conversation_hooks.red_flags_to_listen_for.map((f: string) => `⚠️ ${f}`).join("\n")}

## Recommended Inceed Angle

**Lead With:** ${briefing.recommended_inceed_angle.primary_service_to_lead_with}

### Why This Fits
${briefing.recommended_inceed_angle.why_this_fits.map((r: string) => `✓ ${r}`).join("\n")}

### What Not to Pitch First
${briefing.recommended_inceed_angle.what_not_to_pitch_first.map((x: string) => `✗ ${x}`).join("\n")}

## Confidence: ${briefing.assumptions_and_confidence.confidence_score_0_100}%

### Assumptions Made
${briefing.assumptions_and_confidence.assumptions.map((a: string) => `- ${a}`).join("\n")}
`;

  return md;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's auth header for JWT validation
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate the JWT and get user
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      console.error("JWT validation failed:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user_id from verified user
    const user_id = user.id;

    // Parse and validate input
    let rawInput;
    try {
      rawInput = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validationResult = companyInputSchema.safeParse(rawInput);
    if (!validationResult.success) {
      console.error("Input validation failed:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validationResult.error.errors.map((e) => e.message) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const {
      company_name,
      company_url,
      target_contact_type,
      lead_source,
      initial_interest,
      industry,
      meeting_type,
      known_pain,
      region,
      notes,
    } = validationResult.data;

    console.log(`Generating briefing for ${company_name} (${company_url}) by user ${user_id}`);

    // Fetch website content
    const websiteData = await fetchWebsiteContent(company_url);
    console.log(`Fetched ${websiteData.pages.length} pages, success: ${websiteData.success}`);

    // Build context for LLM
    const contextParts = [
      `Company Name: ${company_name}`,
      `Website: ${company_url}`,
      `Target Contact Type: ${target_contact_type}`,
    ];

    if (lead_source) contextParts.push(`Lead Source: ${lead_source}`);
    if (initial_interest) contextParts.push(`Why Rep Targeted This Company: ${initial_interest}`);
    if (industry) contextParts.push(`Industry: ${industry}`);
    if (meeting_type) contextParts.push(`Meeting Type: ${meeting_type}`);
    if (known_pain) contextParts.push(`Known Pain Points: ${known_pain}`);
    if (region) contextParts.push(`Region: ${region}`);
    if (notes) contextParts.push(`Additional Notes: ${notes}`);

    if (websiteData.content) {
      contextParts.push(`\nWEBSITE CONTENT:\n${websiteData.content}`);
    } else {
      contextParts.push(
        `\nNote: Website fetch failed. Generate briefing based on provided inputs only and mark confidence lower.`,
      );
    }

    const systemPrompt = `You are helping a BRAND NEW sales rep at Inceed (an IT and Accounting/Finance staffing firm based in Tulsa, OK) prepare for their first client calls. They are still learning:
- How to identify good target companies
- Why companies use staffing firms
- How to handle common objections
- What to say when asked basic questions about Inceed

Your output should EDUCATE and BUILD CONFIDENCE, not just provide data.

IMPORTANT RULES:
1. If data is missing, state assumptions clearly and label them as "likely" or "assumed"
2. Generate exactly 5 likely hiring gaps if possible
3. Be specific and actionable in your recommendations
4. Difficulty ratings (1-5 stars) should reflect market reality
5. The sample opener script should be natural and conversational
6. Focus on insights that are immediately useful for a call
7. If a TEAM PAGE section is provided, use any named leadership or department heads shown there to sharpen your recommended angle and conversation hooks. Only reference people explicitly listed on the page. Never guess names.

For the Qualification Assessment:
- Be honest if this doesn't look like a strong fit
- Explain your reasoning so they learn what to look for
- Consider: Are they hiring in roles Inceed fills? Do they show signs of using contractors? Are they growing or in transition?
- Scores: "Strong fit" (clearly needs staffing in IT/Finance), "Possible fit" (some signals), "Needs validation" (unclear), "Likely not a fit" (poor signals)

For "Why They'd Need Inceed":
- Explain the business pain in simple terms a new rep can understand
- Connect it to what Inceed actually does
- Help them understand WHY staffing solves problems, not just THAT it does

For Objection Handling:
- Anticipate 2-4 likely objections based on company size, industry, and signals
- Common objections include: "We use an MSP/preferred vendor", "We only hire full-time", "We handle recruiting internally", "We're not hiring right now", "We've had bad experiences with staffing firms"
- Explain WHY the client might say this (builds empathy)
- Provide conversational response frameworks, not scripts

For the FAQ section:
- Always include these standard Inceed questions:
  * "What does Inceed charge?"
  * "What's your process/timeline?"
  * "What makes Inceed different?"
  * "What roles do you fill?"
- Plus 1-2 company-specific questions based on their industry or situation
- Provide simple, confident answer frameworks
- Keep it conversational, not corporate

Inceed offers: IT staffing, Accounting/Finance staffing, direct hire placement, contract-to-hire, executive search, and workforce consulting.`;

    const userPrompt = `Generate a company briefing for the following context:\n\n${contextParts.join("\n")}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Call Lovable AI Gateway with tool calling for structured output
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_company_briefing",
              description: "Generate a structured company briefing for call preparation, optimized for new sales reps",
              parameters: COMPANY_BRIEFING_SCHEMA,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_company_briefing" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    // Extract the structured output from tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_company_briefing") {
      throw new Error("Invalid AI response structure");
    }

    const companyBriefing = JSON.parse(toolCall.function.arguments);

    // Update pages reviewed with actual fetch results
    companyBriefing.website_signals.pages_reviewed = websiteData.pages;

    // Generate markdown
    const briefingMd = generateMarkdown(companyBriefing);

    // Use service role key for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: briefingData, error: dbError } = await supabase
      .from("briefings")
      .insert({
        user_id, // From verified JWT, not from request body
        company_name,
        company_url,
        target_contact_type,
        industry,
        meeting_type,
        known_pain,
        region,
        notes,
        website_sources: websiteData.pages,
        company_context: {
          input_context: contextParts.slice(0, 10),
          lead_source,
          initial_interest,
        },
        company_briefing: companyBriefing,
        company_briefing_md: briefingMd,
        status: "ready",
        confidence_score: companyBriefing.assumptions_and_confidence.confidence_score_0_100,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to save briefing");
    }

    console.log(`Briefing saved with ID: ${briefingData.id}`);

    return new Response(
      JSON.stringify({
        briefing_id: briefingData.id,
        company_briefing: companyBriefing,
        company_briefing_md: briefingMd,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in generate-company-briefing:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
