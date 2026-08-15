import { z } from "zod";

// Lead source options
export const leadSources = [
  "Job board posting",
  "LinkedIn search",
  "Referral",
  "News/article",
  "Industry list",
  "Other",
] as const;

// Company form validation schema
export const companyFormSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  company_url: z.string().url("Please enter a valid URL"),
  target_contact_type: z.string().min(1, "Select a target contact type"),
  lead_source: z.enum([
    "Job board posting",
    "LinkedIn search",
    "Referral",
    "News/article",
    "Industry list",
    "Other",
  ]).optional(),
  initial_interest: z.string().optional(),
  industry: z.string().optional(),
  meeting_type: z.enum(["Intro call", "Discovery", "Follow-up"]).optional(),
  known_pain: z.string().optional(),
  region: z.string().optional(),
  notes: z.string().optional(),
});

export type CompanyFormData = z.infer<typeof companyFormSchema>;

// Contact enrichment form validation schema
export const contactFormSchema = z.object({
  person_name: z.string().min(1, "Person name is required"),
  person_title: z.string().optional(),
  linkedin_url: z.string().url("Please enter a valid LinkedIn URL"),
  linkedin_text: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// Company briefing output schema
export const companyBriefingSchema = z.object({
  company_snapshot: z.object({
    one_liner: z.string(),
    industry: z.string(),
    estimated_size: z.string(),
    hq_or_region: z.string(),
    what_they_sell: z.string(),
    who_they_sell_to: z.string(),
    notable_signals: z.array(z.string()),
  }),
  website_signals: z.object({
    pages_reviewed: z.array(
      z.object({
        url: z.string(),
        type: z.enum(["homepage", "about", "services", "news", "careers", "contact", "team", "other"]),
        fetch_status: z.enum(["ok", "failed"]),
      })
    ),
    products_services: z.array(z.string()),
    positioning_keywords: z.array(z.string()),
    tech_stack_hints: z.array(z.string()),
    opportunity_signals: z.object({
      signals_matched: z.array(z.string()),
      content_freshness: z.string(),
      notable_absences: z.array(z.string()),
    }),
  }).optional(),
  // AI & Technology Investments (from Perplexity research)
  ai_technology_investments: z.object({
    major_investments: z.array(z.object({
      name: z.string(),
      value: z.string().nullable().optional(),
      date: z.string().nullable().optional(),
      significance: z.string().nullable().optional(),
    })).optional(),
    internal_capabilities: z.array(z.object({
      name: z.string(),
      description: z.string(),
    })).optional(),
    strategic_positioning: z.string().nullable().optional(),
    why_it_matters: z.string().nullable().optional(),
    research_available: z.boolean(),
  }).optional(),
  // Recent News That Matters (from Perplexity research)
  recent_news: z.object({
    items: z.array(z.object({
      news_item: z.string(),
      why_it_matters: z.string(),
    })).optional(),
    research_available: z.boolean(),
  }).optional(),
  // Qualification Assessment
  qualification_assessment: z.object({
    score: z.enum(["Strong fit", "Possible fit", "Needs validation", "Likely not a fit"]),
    positive_signals: z.array(z.string()),
    concerns: z.array(z.string()),
    recommendation: z.string(),
  }).optional(),
  // Why They Need You
  why_they_need_you: z.object({
    pain_point_explanation: z.string(),
    business_context: z.string(),
    value_connection: z.string(),
  }).optional(),
  // Common Objections with responses
  common_objections: z.array(
    z.object({
      objection: z.string(),
      why_they_say_this: z.string(),
      suggested_response: z.string(),
    })
  ).optional(),
  // If They Ask
  if_they_ask: z.array(
    z.object({
      question: z.string(),
      answer_framework: z.string(),
    })
  ).optional(),
  identified_gaps: z.array(
    z.object({
      gap_title: z.string(),
      why_it_matters: z.string(),
      urgency_stars: z.number().min(1).max(5),
      addressed_by_offering: z.string(),
      supporting_evidence: z.array(z.string()),
    })
  ),
  conversation_hooks: z.object({
    for_first_touch: z.array(z.string()),
    for_live_conversation: z.array(z.string()),
    sample_opener_script: z.string(),
    discovery_questions: z.array(z.string()),
    red_flags_to_listen_for: z.array(z.string()),
  }),
  recommended_angle: z.object({
    primary_service_to_lead_with: z.string(),
    why_this_fits: z.array(z.string()),
    what_not_to_pitch_first: z.array(z.string()),
  }),
  assumptions_and_confidence: z.object({
    assumptions: z.array(z.string()),
    confidence_score_0_100: z.number().min(0).max(100),
  }),
});

export type CompanyBriefing = z.infer<typeof companyBriefingSchema>;

// Contact enrichment output schema
export const contactEnrichmentSchema = z.object({
  contact_snapshot: z.object({
    person_name: z.string(),
    person_title: z.string(),
    linkedin_url: z.string(),
    provided_linkedin_text_used: z.boolean(),
  }),
  // Background & Career Context (from Perplexity research)
  background_career_context: z.object({
    location: z.string().nullable().optional(),
    education: z.string().nullable().optional(),
    career_history: z.array(z.object({
      company: z.string(),
      title: z.string(),
      tenure: z.string(),
    })).optional(),
    professional_reputation: z.string().nullable().optional(),
    conversation_hooks: z.array(z.string()).optional(),
    research_available: z.boolean(),
  }).optional(),
  role_influence_and_priorities: z.object({
    likely_top_priorities: z.array(z.string()),
    how_they_measure_success: z.array(z.string()),
    where_they_influence_hiring: z.array(z.string()),
  }),
  best_conversation_entry: z.object({
    best_opening_line: z.string(),
    value_hypothesis: z.array(z.string()),
    avoid_these_angles: z.array(z.string()),
  }),
  personalized_questions: z.array(z.string()),
  personalized_followup_email: z.object({
    subject: z.string(),
    body: z.string(),
  }),
  guardrails: z.object({
    no_scraping_statement: z.string(),
    assumptions_labeled: z.boolean(),
  }),
});

export type ContactEnrichment = z.infer<typeof contactEnrichmentSchema>;

// Industry options
export const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Retail",
  "Energy",
  "Education",
  "Real Estate",
  "Transportation",
  "Telecommunications",
  "Professional Services",
  "Government",
  "Other",
] as const;

// Region options
export const regions = [
  "Local",
  "Regional",
  "National",
  "Remote-first",
] as const;
