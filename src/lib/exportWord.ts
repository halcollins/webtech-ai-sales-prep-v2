import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import { CompanyBriefing, ContactEnrichment } from "./schemas";

const createHeading = (text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) => {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 300, after: 150 },
  });
};

const createBulletPoint = (text: string) => {
  return new Paragraph({
    children: [new TextRun(text)],
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
};

const createLabeledParagraph = (label: string, value: string) => {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun(value),
    ],
    spacing: { after: 100 },
  });
};

const createStarRating = (stars: number) => {
  return "★".repeat(stars) + "☆".repeat(5 - stars);
};

export async function exportBriefingToWord(
  companyName: string,
  companyUrl: string,
  briefing: CompanyBriefing,
  contact?: ContactEnrichment | null,
  createdAt?: string
) {
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Sales Briefing: ${companyName}`, bold: true, size: 48 }),
      ],
      spacing: { after: 200 },
    })
  );

  children.push(createLabeledParagraph("Company URL", companyUrl));
  if (createdAt) {
    children.push(createLabeledParagraph("Generated", new Date(createdAt).toLocaleDateString()));
  }
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Qualification Assessment
  if (briefing.qualification_assessment) {
    children.push(createHeading("📊 Qualification Assessment", HeadingLevel.HEADING_1));
    
    const qa = briefing.qualification_assessment;
    children.push(createLabeledParagraph("Score", qa.score));
    
    children.push(new Paragraph({
      children: [new TextRun({ text: "Positive Signals:", bold: true })],
      spacing: { before: 150, after: 80 },
    }));
    qa.positive_signals.forEach(signal => children.push(createBulletPoint(`✅ ${signal}`)));

    children.push(new Paragraph({
      children: [new TextRun({ text: "Concerns:", bold: true })],
      spacing: { before: 150, after: 80 },
    }));
    qa.concerns.forEach(concern => children.push(createBulletPoint(`⚠️ ${concern}`)));

    children.push(createLabeledParagraph("Recommendation", qa.recommendation));
    children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
  }

  // Company Snapshot
  children.push(createHeading("🏢 Company Snapshot", HeadingLevel.HEADING_1));
  const snapshot = briefing.company_snapshot;
  
  children.push(new Paragraph({
    children: [new TextRun({ text: snapshot.one_liner, italics: true, size: 24 })],
    spacing: { after: 200 },
  }));

  children.push(createLabeledParagraph("Industry", snapshot.industry));
  children.push(createLabeledParagraph("Size", snapshot.estimated_size));
  children.push(createLabeledParagraph("Location", snapshot.hq_or_region));
  children.push(createLabeledParagraph("What They Sell", snapshot.what_they_sell));
  children.push(createLabeledParagraph("Who They Sell To", snapshot.who_they_sell_to));

  if (snapshot.notable_signals.length > 0) {
    children.push(new Paragraph({
      children: [new TextRun({ text: "Notable Signals:", bold: true })],
      spacing: { before: 150, after: 80 },
    }));
    snapshot.notable_signals.forEach(signal => children.push(createBulletPoint(signal)));
  }
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // AI & Technology Investments
  if (briefing.ai_technology_investments) {
    children.push(createHeading("🔬 AI & Technology Investments", HeadingLevel.HEADING_1));
    const ati = briefing.ai_technology_investments;

    if (ati.major_investments && ati.major_investments.length > 0) {
      children.push(new Paragraph({
        children: [new TextRun({ text: "Major Investments:", bold: true })],
        spacing: { before: 150, after: 80 },
      }));
      ati.major_investments.forEach((inv: any) => {
        const invText = inv.value ? `${inv.name} (${inv.value})` : inv.name;
        children.push(createBulletPoint(`${invText}${inv.date ? ` - ${inv.date}` : ""}${inv.significance ? `: ${inv.significance}` : ""}`));
      });
    }

    if (ati.internal_capabilities && ati.internal_capabilities.length > 0) {
      children.push(new Paragraph({
        children: [new TextRun({ text: "Internal Capabilities:", bold: true })],
        spacing: { before: 150, after: 80 },
      }));
      ati.internal_capabilities.forEach((cap: any) => {
        children.push(createBulletPoint(`${cap.name}: ${cap.description}`));
      });
    }

    if (ati.strategic_positioning) {
      children.push(new Paragraph({
        children: [new TextRun({ text: "Strategic Positioning:", bold: true })],
        spacing: { before: 150, after: 80 },
      }));
      children.push(new Paragraph({ text: ati.strategic_positioning, spacing: { after: 150 } }));
    }

    if (ati.why_it_matters) {
      children.push(new Paragraph({
        children: [new TextRun({ text: "Why It Matters:", bold: true })],
        spacing: { before: 150, after: 80 },
      }));
      children.push(new Paragraph({ text: ati.why_it_matters, spacing: { after: 200 } }));
    }
  }

  // Recent News That Matters
  if (briefing.recent_news && briefing.recent_news.items && briefing.recent_news.items.length > 0) {
    children.push(createHeading("📰 Recent News That Matters", HeadingLevel.HEADING_1));
    
    briefing.recent_news.items.forEach((item: any, index: number) => {
      children.push(new Paragraph({
        children: [new TextRun({ text: `${index + 1}. ${item.news_item}`, bold: true })],
        spacing: { before: 150, after: 80 },
      }));
      children.push(new Paragraph({
        children: [
          new TextRun({ text: "Why it matters: ", bold: true }),
          new TextRun(item.why_it_matters),
        ],
        spacing: { after: 150 },
      }));
    });
    children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
  }

  // Why They Need You
  if (briefing.why_they_need_you) {
    children.push(createHeading("💡 Why They Need Us", HeadingLevel.HEADING_1));
    const wts = briefing.why_they_need_you;
    
    children.push(new Paragraph({
      children: [new TextRun({ text: "Pain Point:", bold: true })],
      spacing: { before: 100, after: 80 },
    }));
    children.push(new Paragraph({ text: wts.pain_point_explanation, spacing: { after: 150 } }));
    
    children.push(new Paragraph({
      children: [new TextRun({ text: "Business Context:", bold: true })],
      spacing: { before: 100, after: 80 },
    }));
    children.push(new Paragraph({ text: wts.business_context, spacing: { after: 150 } }));
    
    children.push(new Paragraph({
      children: [new TextRun({ text: "Our Value:", bold: true })],
      spacing: { before: 100, after: 80 },
    }));
    children.push(new Paragraph({ text: wts.value_connection, spacing: { after: 200 } }));
  }

  // Identified Gaps
  children.push(createHeading("🎯 Identified Gaps", HeadingLevel.HEADING_1));
  briefing.identified_gaps.forEach((gap, index) => {
    children.push(new Paragraph({
      children: [
        new TextRun({ text: `${index + 1}. ${gap.gap_title}`, bold: true }),
        new TextRun({ text: `  ${createStarRating(gap.urgency_stars)} Urgency` }),
      ],
      spacing: { before: 150, after: 80 },
    }));
    children.push(new Paragraph({ text: gap.why_it_matters, spacing: { after: 80 } }));
    children.push(createLabeledParagraph("Addressed by", gap.addressed_by_offering));
    children.push(new Paragraph({
      text: `Evidence: ${gap.supporting_evidence.join(", ")}`,
      spacing: { after: 150 },
    }));
  });
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Recommended Angle
  children.push(createHeading("🚀 Recommended Approach", HeadingLevel.HEADING_1));
  const angle = briefing.recommended_angle;
  children.push(createLabeledParagraph("Lead With", angle.primary_service_to_lead_with));
  
  children.push(new Paragraph({
    children: [new TextRun({ text: "Why This Fits:", bold: true })],
    spacing: { before: 150, after: 80 },
  }));
  angle.why_this_fits.forEach(reason => children.push(createBulletPoint(reason)));

  children.push(new Paragraph({
    children: [new TextRun({ text: "What NOT to Pitch First:", bold: true })],
    spacing: { before: 150, after: 80 },
  }));
  angle.what_not_to_pitch_first.forEach(item => children.push(createBulletPoint(`❌ ${item}`)));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Conversation Hooks
  children.push(createHeading("💬 Conversation Guide", HeadingLevel.HEADING_1));
  const hooks = briefing.conversation_hooks;

  children.push(new Paragraph({
    children: [new TextRun({ text: "Sample Opener:", bold: true })],
    spacing: { before: 100, after: 80 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: `"${hooks.sample_opener_script}"`, italics: true })],
    spacing: { after: 200 },
  }));

  children.push(new Paragraph({
    children: [new TextRun({ text: "Discovery Questions:", bold: true })],
    spacing: { before: 100, after: 80 },
  }));
  hooks.discovery_questions.forEach((q, i) => children.push(createBulletPoint(`${i + 1}. ${q}`)));

  children.push(new Paragraph({
    children: [new TextRun({ text: "First Touch:", bold: true })],
    spacing: { before: 200, after: 80 },
  }));
  hooks.for_first_touch.forEach(hook => children.push(createBulletPoint(hook)));

  children.push(new Paragraph({
    children: [new TextRun({ text: "Live Conversation:", bold: true })],
    spacing: { before: 150, after: 80 },
  }));
  hooks.for_live_conversation.forEach(hook => children.push(createBulletPoint(hook)));

  children.push(new Paragraph({
    children: [new TextRun({ text: "Red Flags to Listen For:", bold: true, color: "CC0000" })],
    spacing: { before: 150, after: 80 },
  }));
  hooks.red_flags_to_listen_for.forEach(flag => children.push(createBulletPoint(`🚩 ${flag}`)));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Objection Handling
  if (briefing.common_objections && briefing.common_objections.length > 0) {
    children.push(createHeading("🛡️ Objection Handling", HeadingLevel.HEADING_1));
    
    briefing.common_objections.forEach((obj, index) => {
      children.push(new Paragraph({
        children: [new TextRun({ text: `Objection ${index + 1}: "${obj.objection}"`, bold: true })],
        spacing: { before: 200, after: 80 },
      }));
      children.push(new Paragraph({
        children: [
          new TextRun({ text: "Why they say this: ", bold: true }),
          new TextRun(obj.why_they_say_this),
        ],
        spacing: { after: 80 },
      }));
      children.push(new Paragraph({
        children: [
          new TextRun({ text: "Response: ", bold: true }),
          new TextRun({ text: obj.suggested_response, italics: true }),
        ],
        spacing: { after: 150 },
      }));
    });
    children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
  }

  // New Rep FAQ
  if (briefing.if_they_ask && briefing.if_they_ask.length > 0) {
    children.push(createHeading("❓ Quick Reference FAQ", HeadingLevel.HEADING_1));
    
    briefing.if_they_ask.forEach(faq => {
      children.push(new Paragraph({
        children: [new TextRun({ text: `Q: ${faq.question}`, bold: true })],
        spacing: { before: 150, after: 80 },
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: `A: ${faq.answer_framework}` })],
        spacing: { after: 150 },
      }));
    });
    children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
  }

  // Contact Enrichment Section
  if (contact) {
    children.push(createHeading("👤 Contact: " + contact.contact_snapshot.person_name, HeadingLevel.HEADING_1));
    children.push(createLabeledParagraph("Title", contact.contact_snapshot.person_title));
    children.push(createLabeledParagraph("LinkedIn", contact.contact_snapshot.linkedin_url));
    children.push(new Paragraph({ text: "", spacing: { after: 150 } }));

    // Background & Career Context
    if (contact.background_career_context) {
      const bcc = contact.background_career_context;
      children.push(new Paragraph({
        children: [new TextRun({ text: "Background & Career Context:", bold: true })],
        spacing: { before: 150, after: 80 },
      }));

      if (bcc.location) {
        children.push(createLabeledParagraph("Location", bcc.location));
      }
      if (bcc.education) {
        children.push(createLabeledParagraph("Education", bcc.education));
      }

      if (bcc.career_history && bcc.career_history.length > 0) {
        children.push(new Paragraph({
          children: [new TextRun({ text: "Career History:", bold: true })],
          spacing: { before: 100, after: 80 },
        }));
        bcc.career_history.forEach((job: any) => {
          children.push(createBulletPoint(`${job.title} at ${job.company}${job.tenure && job.tenure !== "N/A" ? ` (${job.tenure})` : ""}`));
        });
      }

      if (bcc.professional_reputation) {
        children.push(new Paragraph({
          children: [new TextRun({ text: "Professional Reputation:", bold: true })],
          spacing: { before: 100, after: 80 },
        }));
        children.push(new Paragraph({ text: bcc.professional_reputation, spacing: { after: 150 } }));
      }

      if (bcc.conversation_hooks && bcc.conversation_hooks.length > 0) {
        children.push(new Paragraph({
          children: [new TextRun({ text: "Background-Based Hooks:", bold: true })],
          spacing: { before: 100, after: 80 },
        }));
        bcc.conversation_hooks.forEach((hook: string) => {
          children.push(createBulletPoint(`💡 ${hook}`));
        });
      }

      children.push(new Paragraph({ text: "", spacing: { after: 150 } }));
    }

    children.push(new Paragraph({
      children: [new TextRun({ text: "Best Opening Line:", bold: true })],
      spacing: { before: 100, after: 80 },
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: `"${contact.best_conversation_entry.best_opening_line}"`, italics: true })],
      spacing: { after: 200 },
    }));

    children.push(new Paragraph({
      children: [new TextRun({ text: "Their Likely Priorities:", bold: true })],
      spacing: { before: 100, after: 80 },
    }));
    contact.role_influence_and_priorities.likely_top_priorities.forEach(p => 
      children.push(createBulletPoint(p))
    );

    children.push(new Paragraph({
      children: [new TextRun({ text: "Personalized Discovery Questions:", bold: true })],
      spacing: { before: 150, after: 80 },
    }));
    contact.personalized_questions.forEach((q, i) => 
      children.push(createBulletPoint(`${i + 1}. ${q}`))
    );

    children.push(new Paragraph({
      children: [new TextRun({ text: "Avoid These Angles:", bold: true, color: "CC0000" })],
      spacing: { before: 150, after: 80 },
    }));
    contact.best_conversation_entry.avoid_these_angles.forEach(a => 
      children.push(createBulletPoint(`❌ ${a}`))
    );
  }

  // Confidence Score
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
  children.push(new Paragraph({
    children: [
      new TextRun({ text: "Confidence Score: ", bold: true }),
      new TextRun(`${briefing.assumptions_and_confidence.confidence_score_0_100}%`),
    ],
    spacing: { before: 200 },
  }));

  children.push(new Paragraph({
    children: [new TextRun({ text: "Assumptions:", bold: true })],
    spacing: { before: 150, after: 80 },
  }));
  briefing.assumptions_and_confidence.assumptions.forEach(a => 
    children.push(createBulletPoint(a))
  );

  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  // Generate and save
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${companyName.replace(/\s+/g, "-").toLowerCase()}-briefing.docx`);
}
