import { useState } from "react";
import { CompanyBriefing, ContactEnrichment } from "@/lib/schemas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Building2, Target, Briefcase, MessageSquare, Lightbulb, Copy, Check, Star, Users, Mail, CheckCircle, AlertTriangle, Shield, HelpCircle, FlaskConical, Newspaper, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BriefingDisplayProps {
  briefing: CompanyBriefing;
  contactEnrichment?: ContactEnrichment | null;
  briefingMd?: string;
  contactMd?: string;
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied!", description: label || "Content copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 gap-1.5 text-xs">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function DifficultyStars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= count ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function getQualificationBadgeColor(score: string) {
  switch (score) {
    case "Strong fit":
      return "bg-success/20 text-success border-success/30";
    case "Possible fit":
      return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
    case "Needs validation":
      return "bg-orange-500/20 text-orange-600 border-orange-500/30";
    case "Likely not a fit":
      return "bg-destructive/20 text-destructive border-destructive/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function BriefingDisplay({ briefing, contactEnrichment, briefingMd, contactMd }: BriefingDisplayProps) {
  const { toast } = useToast();

  return (
    <Tabs defaultValue="company" className="w-full">
      <TabsList className="mb-6 bg-secondary/50">
        <TabsTrigger value="company" className="gap-2">
          <Building2 className="h-4 w-4" />
          Company Briefing
        </TabsTrigger>
        {contactEnrichment && (
          <TabsTrigger value="contact" className="gap-2">
            <Users className="h-4 w-4" />
            Contact Prep
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="company" className="space-y-6 animate-fade-in">
        {/* Company Snapshot */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Company Snapshot</CardTitle>
              </div>
              <CopyButton text={JSON.stringify(briefing.company_snapshot, null, 2)} label="Company snapshot" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg font-medium">{briefing.company_snapshot.one_liner}</p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Industry</p>
                <p className="text-sm">{briefing.company_snapshot.industry}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Size</p>
                <p className="text-sm">{briefing.company_snapshot.estimated_size}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Location</p>
                <p className="text-sm">{briefing.company_snapshot.hq_or_region}</p>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <p className="text-xs text-muted-foreground mb-1">What They Sell</p>
                <p className="text-sm">{briefing.company_snapshot.what_they_sell}</p>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <p className="text-xs text-muted-foreground mb-1">Target Customers</p>
                <p className="text-sm">{briefing.company_snapshot.who_they_sell_to}</p>
              </div>
            </div>

            {briefing.company_snapshot.notable_signals.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Notable Signals</p>
                <div className="flex flex-wrap gap-2">
                  {briefing.company_snapshot.notable_signals.map((signal, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {signal}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* NEW: AI & Technology Investments */}
        {briefing.ai_technology_investments && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">AI & Technology Investments</CardTitle>
                </div>
                <CopyButton text={JSON.stringify(briefing.ai_technology_investments, null, 2)} label="AI investments" />
              </div>
              <CardDescription>Technology strategy and investments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {briefing.ai_technology_investments.major_investments && briefing.ai_technology_investments.major_investments.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Major Investments</p>
                  <div className="space-y-2">
                    {briefing.ai_technology_investments.major_investments.map((inv, i) => (
                      <div key={i} className="rounded-lg bg-secondary/30 p-3">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium">{inv.name}</p>
                          {inv.value && <Badge variant="outline" className="text-xs">{inv.value}</Badge>}
                        </div>
                        {inv.date && <p className="text-xs text-muted-foreground mt-1">{inv.date}</p>}
                        {inv.significance && <p className="text-sm text-muted-foreground mt-1">{inv.significance}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {briefing.ai_technology_investments.internal_capabilities && briefing.ai_technology_investments.internal_capabilities.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Internal Capabilities</p>
                  <ul className="space-y-1.5">
                    {briefing.ai_technology_investments.internal_capabilities.map((cap, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-primary">•</span>
                        <span><strong>{cap.name}:</strong> {cap.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {briefing.ai_technology_investments.strategic_positioning && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Strategic Positioning</p>
                  <p className="text-sm">{briefing.ai_technology_investments.strategic_positioning}</p>
                </div>
              )}

              {briefing.ai_technology_investments.why_it_matters && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                  <p className="text-xs text-primary mb-1 font-medium">Why It Matters</p>
                  <p className="text-sm">{briefing.ai_technology_investments.why_it_matters}</p>
                </div>
              )}

              {!briefing.ai_technology_investments.research_available && (
                <p className="text-xs text-muted-foreground italic">Limited research available. Information is based on available public data.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* NEW: Recent News That Matters */}
        {briefing.recent_news && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Recent News That Matters</CardTitle>
                </div>
                <CopyButton text={JSON.stringify(briefing.recent_news, null, 2)} label="Recent news" />
              </div>
              <CardDescription>News that affects the conversation</CardDescription>
            </CardHeader>
            <CardContent>
              {briefing.recent_news.items && briefing.recent_news.items.length > 0 ? (
                <div className="space-y-3">
                  {briefing.recent_news.items.map((item, i) => (
                    <div key={i} className="rounded-lg bg-secondary/30 p-3">
                      <p className="text-sm font-medium mb-1">{item.news_item}</p>
                      <p className="text-sm text-muted-foreground">
                        <span className="text-primary font-medium">Why it matters: </span>
                        {item.why_it_matters}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent significant news found.</p>
              )}

              {!briefing.recent_news.research_available && (
                <p className="text-xs text-muted-foreground italic mt-3">Limited research available. Information is based on available public data.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Qualification Assessment */}
        {briefing.qualification_assessment && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Qualification Assessment</CardTitle>
                </div>
                <CopyButton text={JSON.stringify(briefing.qualification_assessment, null, 2)} label="Qualification" />
              </div>
              <CardDescription>Worth pursuing?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge className={`text-sm px-3 py-1 border ${getQualificationBadgeColor(briefing.qualification_assessment.score)}`}>
                {briefing.qualification_assessment.score}
              </Badge>

              {briefing.qualification_assessment.positive_signals.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Positive Signals</p>
                  <ul className="space-y-1.5">
                    {briefing.qualification_assessment.positive_signals.map((signal, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        {signal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {briefing.qualification_assessment.concerns.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Concerns</p>
                  <ul className="space-y-1.5">
                    {briefing.qualification_assessment.concerns.map((concern, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-lg bg-secondary/30 p-4">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Recommendation</p>
                <p className="text-sm">{briefing.qualification_assessment.recommendation}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* NEW: Why They Need Staffing */}
        {briefing.why_they_need_you && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Why Staffing Makes Sense Here</CardTitle>
                </div>
                <CopyButton text={JSON.stringify(briefing.why_they_need_you, null, 2)} label="Staffing rationale" />
              </div>
              <CardDescription>Understanding the business need</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">The Pain Point</p>
                <p className="text-sm">{briefing.why_they_need_you.pain_point_explanation}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">Business Context</p>
                <p className="text-sm">{briefing.why_they_need_you.business_context}</p>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <p className="text-xs text-primary mb-1 font-medium">How Inceed Helps</p>
                <p className="text-sm">{briefing.why_they_need_you.value_connection}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* NEW: Common Objections */}
        {briefing.common_objections && briefing.common_objections.length > 0 && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">If They Push Back...</CardTitle>
                </div>
                <CopyButton text={JSON.stringify(briefing.common_objections, null, 2)} label="Objections" />
              </div>
              <CardDescription>Anticipated objections and how to handle them</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {briefing.common_objections.map((obj, i) => (
                  <AccordionItem key={i} value={`objection-${i}`} className="border-border/50">
                    <AccordionTrigger className="text-sm hover:no-underline">
                      <span className="text-left">{obj.objection}</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Why they say this</p>
                        <p className="text-sm text-muted-foreground">{obj.why_they_say_this}</p>
                      </div>
                      <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                        <p className="text-xs text-primary mb-1 font-medium">Try this</p>
                        <p className="text-sm">{obj.suggested_response}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* NEW: New Rep FAQ */}
        {briefing.if_they_ask && briefing.if_they_ask.length > 0 && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">If They Ask...</CardTitle>
                </div>
                <CopyButton text={JSON.stringify(briefing.if_they_ask, null, 2)} label="FAQ" />
              </div>
              <CardDescription>Quick reference for common questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {briefing.if_they_ask.map((faq, i) => (
                  <div key={i} className="rounded-lg bg-secondary/30 p-4">
                    <p className="text-sm font-medium mb-2">{faq.question}</p>
                    <p className="text-sm text-muted-foreground">{faq.answer_framework}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Likely Hiring & Gaps */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Likely Hiring & Gaps</CardTitle>
              </div>
              <CopyButton text={JSON.stringify(briefing.identified_gaps, null, 2)} label="Hiring gaps" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {briefing.identified_gaps.map((role, i) => (
                <div key={i} className="rounded-lg bg-secondary/30 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{role.role_title}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Difficulty:</span>
                      <DifficultyStars count={role.difficulty_to_fill_stars} />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{role.why_it_matters}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">{role.contract_vs_fte_likelihood}</span>
                  </div>
                  {role.common_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {role.common_skills.map((skill, j) => (
                        <Badge key={j} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conversation Hooks */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Conversation Hooks</CardTitle>
              </div>
              <CopyButton text={JSON.stringify(briefing.conversation_hooks, null, 2)} label="Conversation hooks" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
              <p className="text-xs text-primary mb-2 font-medium">Sample Opener</p>
              <p className="text-sm italic">"{briefing.conversation_hooks.sample_opener_script}"</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">For Recruiter</p>
                <ul className="space-y-1.5">
                  {briefing.conversation_hooks.for_first_touch.map((hook, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-primary">•</span>
                      {hook}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">For Sales</p>
                <ul className="space-y-1.5">
                  {briefing.conversation_hooks.for_live_conversation.map((hook, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-primary">•</span>
                      {hook}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Discovery Questions</p>
              <ul className="space-y-1.5">
                {briefing.conversation_hooks.discovery_questions.map((q, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-primary">{i + 1}.</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>

            {briefing.conversation_hooks.red_flags_to_listen_for.length > 0 && (
              <div>
                <p className="text-xs text-destructive mb-2 font-medium">Red Flags to Listen For</p>
                <ul className="space-y-1.5">
                  {briefing.conversation_hooks.red_flags_to_listen_for.map((flag, i) => (
                    <li key={i} className="text-sm flex gap-2 text-muted-foreground">
                      <span className="text-destructive">⚠</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inceed Angle */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Recommended Inceed Angle</CardTitle>
              </div>
              <CopyButton text={JSON.stringify(briefing.recommended_angle, null, 2)} label="Inceed angle" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
              <p className="text-xs text-primary mb-1 font-medium">Lead With</p>
              <p className="text-lg font-medium">{briefing.recommended_angle.primary_service_to_lead_with}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Why This Fits</p>
              <ul className="space-y-1.5">
                {briefing.recommended_angle.why_this_fits.map((reason, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-success">✓</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            {briefing.recommended_angle.what_not_to_pitch_first.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Avoid Leading With</p>
                <ul className="space-y-1.5">
                  {briefing.recommended_angle.what_not_to_pitch_first.map((item, i) => (
                    <li key={i} className="text-sm flex gap-2 text-muted-foreground">
                      <span>✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confidence */}
        <Card className="border-border/50 bg-secondary/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium">Confidence Score</p>
                <p className="text-xs text-muted-foreground">
                  {briefing.assumptions_and_confidence.assumptions.length} assumptions made
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {briefing.assumptions_and_confidence.confidence_score_0_100}%
                </p>
              </div>
            </div>
            {briefing.assumptions_and_confidence.assumptions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-base text-muted-foreground mb-2">Assumptions</p>
                <ul className="space-y-1">
                  {briefing.assumptions_and_confidence.assumptions.map((a, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      • {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {contactEnrichment && (
        <TabsContent value="contact" className="space-y-6 animate-fade-in">
          {/* Contact Snapshot */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Contact Overview</CardTitle>
                </div>
                <CopyButton
                  text={JSON.stringify(contactEnrichment.contact_snapshot, null, 2)}
                  label="Contact snapshot"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
                  {contactEnrichment.contact_snapshot.person_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{contactEnrichment.contact_snapshot.person_name}</h3>
                  <p className="text-muted-foreground">{contactEnrichment.contact_snapshot.person_title}</p>
                  {!contactEnrichment.contact_snapshot.provided_linkedin_text_used && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      Inferred from title only
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NEW: Background & Career Context */}
          {contactEnrichment.background_career_context && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Background & Career Context</CardTitle>
                  </div>
                  <CopyButton
                    text={JSON.stringify(contactEnrichment.background_career_context, null, 2)}
                    label="Background context"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {contactEnrichment.background_career_context.location && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Location</p>
                      <p className="text-sm">{contactEnrichment.background_career_context.location}</p>
                    </div>
                  )}
                  {contactEnrichment.background_career_context.education && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Education</p>
                      <p className="text-sm">{contactEnrichment.background_career_context.education}</p>
                    </div>
                  )}
                </div>

                {contactEnrichment.background_career_context.career_history && contactEnrichment.background_career_context.career_history.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Career History</p>
                    <div className="space-y-2">
                      {contactEnrichment.background_career_context.career_history.map((job, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-primary">•</span>
                          <span className="font-medium">{job.title}</span>
                          <span className="text-muted-foreground">at {job.company}</span>
                          {job.tenure && job.tenure !== "N/A" && (
                            <Badge variant="outline" className="text-xs">{job.tenure}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {contactEnrichment.background_career_context.professional_reputation && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Professional Reputation</p>
                    <p className="text-sm">{contactEnrichment.background_career_context.professional_reputation}</p>
                  </div>
                )}

                {contactEnrichment.background_career_context.conversation_hooks && contactEnrichment.background_career_context.conversation_hooks.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Background-Based Hooks</p>
                    <ul className="space-y-1.5">
                      {contactEnrichment.background_career_context.conversation_hooks.map((hook, i) => (
                        <li key={i} className="text-sm flex gap-2">
                          <span className="text-success">💡</span>
                          {hook}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!contactEnrichment.background_career_context.research_available && (
                  <p className="text-xs text-muted-foreground italic">Limited background research available. Insights are inferred from title and company context.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Role Influence */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Role Influence & Priorities</CardTitle>
                </div>
                <CopyButton
                  text={JSON.stringify(contactEnrichment.role_influence_and_priorities, null, 2)}
                  label="Role priorities"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Likely Top Priorities</p>
                <ul className="space-y-1.5">
                  {contactEnrichment.role_influence_and_priorities.likely_top_priorities.map((p, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-primary">{i + 1}.</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">How They Measure Success</p>
                <ul className="space-y-1.5">
                  {contactEnrichment.role_influence_and_priorities.how_they_measure_success.map((m, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-success">📊</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Hiring Influence</p>
                <ul className="space-y-1.5">
                  {contactEnrichment.role_influence_and_priorities.where_they_influence_hiring.map((h, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-primary">•</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Best Conversation Entry */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Best Conversation Entry</CardTitle>
                </div>
                <CopyButton
                  text={JSON.stringify(contactEnrichment.best_conversation_entry, null, 2)}
                  label="Conversation entry"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <p className="text-xs text-primary mb-2 font-medium">Best Opening Line</p>
                <p className="text-sm italic">"{contactEnrichment.best_conversation_entry.best_opening_line}"</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Value Hypothesis</p>
                <ul className="space-y-1.5">
                  {contactEnrichment.best_conversation_entry.value_hypothesis.map((v, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-success">✓</span>
                      {v}
                    </li>
                  ))}
                </ul>
              </div>

              {contactEnrichment.best_conversation_entry.avoid_these_angles.length > 0 && (
                <div>
                  <p className="text-xs text-destructive mb-2 font-medium">Avoid These Angles</p>
                  <ul className="space-y-1.5">
                    {contactEnrichment.best_conversation_entry.avoid_these_angles.map((a, i) => (
                      <li key={i} className="text-sm flex gap-2 text-muted-foreground">
                        <span className="text-destructive">✗</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personalized Questions */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Personalized Questions</CardTitle>
                </div>
                <CopyButton text={contactEnrichment.personalized_questions.join("\n")} label="Questions" />
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {contactEnrichment.personalized_questions.map((q, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-primary font-medium">{i + 1}.</span>
                    {q}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Follow-up Email */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Follow-up Email Template</CardTitle>
                </div>
                <CopyButton
                  text={`Subject: ${contactEnrichment.personalized_followup_email.subject}\n\n${contactEnrichment.personalized_followup_email.body}`}
                  label="Email template"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Subject</p>
                <p className="text-sm font-medium">{contactEnrichment.personalized_followup_email.subject}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Body</p>
                <div className="rounded-lg bg-secondary/30 p-4">
                  <p className="text-sm whitespace-pre-wrap">{contactEnrichment.personalized_followup_email.body}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guardrails */}
          <Card className="border-border/50 bg-secondary/30">
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">{contactEnrichment.guardrails.no_scraping_statement}</p>
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
}
