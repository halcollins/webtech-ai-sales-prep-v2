import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const contactInputSchema = z.object({
  briefing_id: z.string().uuid("Invalid briefing ID format"),
  person_name: z.string().min(1, "Person name is required").max(200, "Person name too long"),
  person_title: z.string().max(200, "Person title too long").optional().nullable(),
  linkedin_url: z.string().url("Invalid LinkedIn URL format").refine(url => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, "Only HTTP(S) URLs allowed"),
  linkedin_text: z.string().max(50000, "LinkedIn text too long (max 50KB)").optional().nullable(),
});

const CONTACT_ENRICHMENT_SCHEMA = {
  type: "object",
  properties: {
    contact_snapshot: {
      type: "object",
      properties: {
        person_name: { type: "string" },
        person_title: { type: "string" },
        linkedin_url: { type: "string" },
        provided_linkedin_text_used: { type: "boolean" },
      },
      required: ["person_name", "person_title", "linkedin_url", "provided_linkedin_text_used"],
    },
    background_career_context: {
      type: "object",
      properties: {
        location: { type: ["string", "null"] },
        education: { type: ["string", "null"] },
        career_history: {
          type: "array",
          items: {
            type: "object",
            properties: {
              company: { type: "string" },
              title: { type: "string" },
              tenure: { type: "string" },
            },
            required: ["company", "title", "tenure"],
          },
        },
        professional_reputation: { type: ["string", "null"] },
        conversation_hooks: { type: "array", items: { type: "string" } },
        research_available: { type: "boolean" },
      },
      required: ["career_history", "conversation_hooks", "research_available"],
    },
    role_influence_and_priorities: {
      type: "object",
      properties: {
        likely_top_priorities: { type: "array", items: { type: "string" } },
        how_they_measure_success: { type: "array", items: { type: "string" } },
        where_they_influence_hiring: { type: "array", items: { type: "string" } },
      },
      required: ["likely_top_priorities", "how_they_measure_success", "where_they_influence_hiring"],
    },
    best_conversation_entry: {
      type: "object",
      properties: {
        best_opening_line: { type: "string" },
        value_hypothesis: { type: "array", items: { type: "string" } },
        avoid_these_angles: { type: "array", items: { type: "string" } },
      },
      required: ["best_opening_line", "value_hypothesis", "avoid_these_angles"],
    },
    personalized_questions: { type: "array", items: { type: "string" } },
    personalized_followup_email: {
      type: "object",
      properties: {
        subject: { type: "string" },
        body: { type: "string" },
      },
      required: ["subject", "body"],
    },
    guardrails: {
      type: "object",
      properties: {
        no_scraping_statement: { type: "string" },
        assumptions_labeled: { type: "boolean" },
      },
      required: ["no_scraping_statement", "assumptions_labeled"],
    },
  },
  required: ["contact_snapshot", "background_career_context", "role_influence_and_priorities", "best_conversation_entry", "personalized_questions", "personalized_followup_email", "guardrails"],
};

function generateContactMarkdown(enrichment: any): string {
  let markdown = `# Contact Prep: ${enrichment.contact_snapshot.person_name}

**Title:** ${enrichment.contact_snapshot.person_title}
**LinkedIn:** ${enrichment.contact_snapshot.linkedin_url}
${enrichment.contact_snapshot.provided_linkedin_text_used ? "*(Based on provided LinkedIn text)*" : "*(Inferred from title only)*"}

`;

  // Background & Career Context (if available)
  if (enrichment.background_career_context) {
    const bcc = enrichment.background_career_context;
    markdown += `## Background & Career Context\n\n`;
    
    if (bcc.location) {
      markdown += `**Location:** ${bcc.location}\n`;
    }
    if (bcc.education) {
      markdown += `**Education:** ${bcc.education}\n`;
    }
    
    if (bcc.career_history && bcc.career_history.length > 0) {
      markdown += `\n### Career History\n`;
      bcc.career_history.forEach((job: any) => {
        markdown += `- **${job.title}** at ${job.company} (${job.tenure})\n`;
      });
    }
    
    if (bcc.professional_reputation) {
      markdown += `\n### Professional Reputation\n${bcc.professional_reputation}\n`;
    }
    
    if (bcc.conversation_hooks && bcc.conversation_hooks.length > 0) {
      markdown += `\n### Background-Based Conversation Hooks\n`;
      bcc.conversation_hooks.forEach((hook: string) => {
        markdown += `- ${hook}\n`;
      });
    }
    
    if (!bcc.research_available) {
      markdown += `\n*Note: Limited background research available. Insights are based on title and company context.*\n`;
    }
    markdown += `\n`;
  }

  markdown += `## Role Influence & Priorities

### Likely Top Priorities
${enrichment.role_influence_and_priorities.likely_top_priorities.map((p: string, i: number) => `${i + 1}. ${p}`).join("\n")}

### How They Measure Success
${enrichment.role_influence_and_priorities.how_they_measure_success.map((m: string) => `- ${m}`).join("\n")}

### Where They Influence Hiring
${enrichment.role_influence_and_priorities.where_they_influence_hiring.map((h: string) => `- ${h}`).join("\n")}

## Best Conversation Entry

### Opening Line
> "${enrichment.best_conversation_entry.best_opening_line}"

### Value Hypothesis
${enrichment.best_conversation_entry.value_hypothesis.map((v: string) => `✓ ${v}`).join("\n")}

### Avoid These Angles
${enrichment.best_conversation_entry.avoid_these_angles.map((a: string) => `✗ ${a}`).join("\n")}

## Personalized Questions
${enrichment.personalized_questions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}

## Follow-up Email Template

**Subject:** ${enrichment.personalized_followup_email.subject}

${enrichment.personalized_followup_email.body}

---
*${enrichment.guardrails.no_scraping_statement}*
`;

  return markdown;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's auth header for JWT validation
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate the JWT and get user
    const { data: { user }, error: userError } = await authClient.auth.getUser();
    
    if (userError || !user) {
      console.error("JWT validation failed:", userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user_id from verified user
    const user_id = user.id;

    // Parse and validate input
    let rawInput;
    try {
      rawInput = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validationResult = contactInputSchema.safeParse(rawInput);
    if (!validationResult.success) {
      console.error("Input validation failed:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.errors.map(e => e.message) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { briefing_id, person_name, person_title, linkedin_url, linkedin_text } = validationResult.data;

    console.log(`Generating contact enrichment for ${person_name} on briefing ${briefing_id} by user ${user_id}`);

    // Use service role key for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the company briefing - verify ownership via user_id from JWT
    const { data: briefingData, error: briefingError } = await supabase
      .from("briefings")
      .select("company_name, company_url, target_contact_type, industry, company_briefing")
      .eq("id", briefing_id)
      .eq("user_id", user_id) // Verify the briefing belongs to this user
      .single();

    if (briefingError || !briefingData) {
      console.error("Briefing not found or access denied:", briefingError);
      return new Response(
        JSON.stringify({ error: "Briefing not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hasLinkedInText = !!linkedin_text && linkedin_text.trim().length > 0;

    // Perform Perplexity research for background info
    let backgroundResearch: string | null = null;
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    
    if (PERPLEXITY_API_KEY) {
      try {
        console.log(`Researching background for ${person_name}...`);
        const researchQuery = `${person_name} ${person_title || ""} ${briefingData.company_name} career background experience professional history`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              { role: "system", content: "You are a research assistant. Provide factual background information about the person. Include location, education, career history, and any notable professional achievements. Be concise and factual. If information is not found, say so clearly." },
              { role: "user", content: researchQuery }
            ],
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          backgroundResearch = perplexityData.choices?.[0]?.message?.content || null;
          console.log("Background research completed");
        } else {
          console.warn("Perplexity research failed:", perplexityResponse.status);
        }
      } catch (e) {
        console.error("Perplexity research error:", e);
        // Continue without research
      }
    } else {
      console.log("PERPLEXITY_API_KEY not configured, skipping background research");
    }

    // Build context for LLM
    const contextParts = [
      `Company: ${briefingData.company_name}`,
      `Website: ${briefingData.company_url}`,
      `Industry: ${briefingData.industry || "Unknown"}`,
      `Target Contact Type: ${briefingData.target_contact_type}`,
      "",
      `Contact: ${person_name}`,
      `Title: ${person_title || "Unknown"}`,
      `LinkedIn URL: ${linkedin_url}`,
    ];

    if (hasLinkedInText) {
      // Truncate if too long to prevent excessive token usage
      const truncatedLinkedInText = linkedin_text!.slice(0, 40000);
      contextParts.push(`\nLINKEDIN TEXT PROVIDED BY USER:\n${truncatedLinkedInText}`);
    } else {
      contextParts.push(`\nNote: No LinkedIn text was provided. Generate insights based ONLY on the title and general role expectations. Label all inferences as "likely" or "typical for this role".`);
    }

    // Add background research if available
    if (backgroundResearch) {
      contextParts.push(`\nBACKGROUND RESEARCH (from web search):\n${backgroundResearch}`);
    } else {
      contextParts.push(`\nBACKGROUND RESEARCH: Research unavailable. Generate background_career_context with research_available: false and infer based on title/company.`);
    }

    // Load the single seller profile (service role bypasses RLS)
    const { data: profile, error: profileError } = await supabase
      .from("company_profile")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to load company profile:", profileError);
      throw new Error("Failed to load company profile");
    }

    if (!profile) {
      return new Response(
        JSON.stringify({
          error: "No company profile configured. An admin must set one up before enrichment can be generated.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sellerName = profile.company_name;
    const formatList = (items: unknown): string => {
      if (!Array.isArray(items) || items.length === 0) return "(none provided)";
      return items.map((i) => `- ${typeof i === "string" ? i : JSON.stringify(i)}`).join("\n");
    };

    // Add company briefing context
    if (briefingData.company_briefing) {
      const cb = briefingData.company_briefing as any;
      contextParts.push(`\nCOMPANY BRIEFING CONTEXT:`);
      contextParts.push(`- One-liner: ${cb.company_snapshot?.one_liner || "N/A"}`);
      contextParts.push(`- What they sell: ${cb.company_snapshot?.what_they_sell || "N/A"}`);
      contextParts.push(`- Recommended lead service: ${cb.recommended_angle?.primary_service_to_lead_with || "N/A"}`);
      if (cb.identified_gaps) {
        contextParts.push(`- Key identified gaps: ${cb.identified_gaps.map((g: any) => g.gap_title).join(", ")}`);
      }
    }

    const systemPrompt = `You are an expert sales strategist for ${sellerName}. Your job is to generate personalized contact preparation that helps team members connect with specific decision-makers.

ABOUT THE SELLER (${sellerName}):
- Website: ${profile.website ?? "(not provided)"}
- Who they serve: ${profile.who_we_serve ?? "(not specified)"}

WHAT ${sellerName.toUpperCase()} SELLS:
${formatList(profile.what_we_sell)}

PROOF POINTS:
${formatList(profile.proof_points)}

KNOWN OBJECTIONS TO ANTICIPATE:
${formatList(profile.known_objections)}

WORDS AND PHRASES YOU MUST NEVER USE:
${formatList(profile.banned_words)}

REP EXPERIENCE LEVEL: ${profile.rep_experience_level}

CRITICAL RULES:
1. You must NEVER claim specific career history or experience if no LinkedIn text was provided AND no background research is available
2. If linkedin_text is not provided, all insights must be labeled as "likely", "typical for this role", or "common for [title]"
3. Base inferences only on: the person's title, the company context, general industry patterns, and any background research provided
4. The opening line should be natural and not presumptuous
5. The follow-up email should be professional and under 150 words
6. Always include the no-scraping statement confirming only provided inputs were used
7. Only reference offerings that appear in WHAT ${sellerName.toUpperCase()} SELLS

BACKGROUND & CAREER CONTEXT SECTION:
- If background research is available, extract location, education, career history (with company, title, tenure), and professional reputation
- Generate 2-3 conversation hooks based on their background (past companies, industries, notable achievements)
- Set research_available: true if research data was provided and useful
- Set research_available: false if research was unavailable or inconclusive
- For career_history, list 3-5 most relevant roles; use "N/A" for tenure if unknown
- If no concrete background info is available, leave location/education as null and career_history as empty array`;

    const userPrompt = `Generate contact enrichment for the following context:\n\n${contextParts.join("\n")}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Call Lovable AI Gateway with tool calling
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
              name: "generate_contact_enrichment",
              description: "Generate personalized contact preparation for a specific decision-maker",
              parameters: CONTACT_ENRICHMENT_SCHEMA,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_contact_enrichment" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    // Extract the structured output from tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_contact_enrichment") {
      throw new Error("Invalid AI response structure");
    }

    const contactEnrichment = JSON.parse(toolCall.function.arguments);
    
    // Ensure the snapshot has correct values
    contactEnrichment.contact_snapshot.person_name = person_name;
    contactEnrichment.contact_snapshot.person_title = person_title || "Unknown";
    contactEnrichment.contact_snapshot.linkedin_url = linkedin_url;
    contactEnrichment.contact_snapshot.provided_linkedin_text_used = hasLinkedInText;

    // Ensure guardrails - updated disclaimer to reflect web research
    contactEnrichment.guardrails = {
      no_scraping_statement: "This analysis was generated using website content and real-time web research. No direct LinkedIn scraping was performed. Verify key details before your call.",
      assumptions_labeled: !hasLinkedInText && !backgroundResearch,
    };

    // Generate markdown
    const enrichmentMd = generateContactMarkdown(contactEnrichment);

    // Save to database
    const { data: contactData, error: dbError } = await supabase
      .from("briefing_contacts")
      .insert({
        briefing_id,
        user_id, // From verified JWT, not from request body
        person_name,
        person_title,
        linkedin_url,
        linkedin_text,
        contact_enrichment: stripNullBytes(contactEnrichment),
        contact_enrichment_md: stripNullBytes(enrichmentMd),
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to save contact enrichment");
    }

    console.log(`Contact enrichment saved with ID: ${contactData.id}`);

    return new Response(
      JSON.stringify({
        contact_id: contactData.id,
        contact_enrichment: contactEnrichment,
        contact_enrichment_md: enrichmentMd,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-contact-enrichment:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
