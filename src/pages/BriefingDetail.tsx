import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { AppLayout } from "@/components/layout/AppLayout";
import { BriefingDisplay } from "@/components/briefing/BriefingDisplay";
import { ContactForm } from "@/components/briefing/ContactForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CompanyBriefing, ContactEnrichment, ContactFormData } from "@/lib/schemas";
import { 
  ChevronLeft, ExternalLink, Download, Copy, 
  Building2, Clock, UserPlus, Check, FileText, FileCode
} from "lucide-react";
import { format } from "date-fns";
import { exportBriefingToWord } from "@/lib/exportWord";
import { exportBriefingToHtml } from "@/lib/exportHtml";

interface Briefing {
  id: string;
  company_name: string;
  company_url: string;
  target_contact_type: string;
  industry: string | null;
  meeting_type: string | null;
  status: string;
  confidence_score: number | null;
  company_briefing: CompanyBriefing | null;
  company_briefing_md: string | null;
  created_at: string;
  user_id: string;
}

interface BriefingContact {
  id: string;
  person_name: string;
  person_title: string | null;
  linkedin_url: string;
  contact_enrichment: ContactEnrichment | null;
  contact_enrichment_md: string | null;
}

export default function BriefingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [contacts, setContacts] = useState<BriefingContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [isExportingWord, setIsExportingWord] = useState(false);

  useEffect(() => {
    async function fetchBriefing() {
      if (!id || !user || adminLoading) return;

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (!isUuid) {
        setBriefing(null);
        setLoading(false);
        return;
      }

      let briefingQuery = supabase
        .from("briefings")
        .select("*")
        .eq("id", id);

      if (!isAdmin) {
        briefingQuery = briefingQuery.eq("user_id", user.id);
      }

      const { data: briefingData, error: briefingError } = await briefingQuery.maybeSingle();

      if (briefingError || !briefingData) {
        console.error("Error fetching briefing:", briefingError);
        setBriefing(null);
        setLoading(false);
        return;
      }


      // Type cast the company_briefing from Json to CompanyBriefing
      const typedBriefing: Briefing = {
        ...briefingData,
        company_briefing: briefingData.company_briefing as unknown as CompanyBriefing | null,
      };
      
      setBriefing(typedBriefing);

      // Fetch contacts
      let contactsQuery = supabase
        .from("briefing_contacts")
        .select("*")
        .eq("briefing_id", id);

      if (!isAdmin) {
        contactsQuery = contactsQuery.eq("user_id", user.id);
      }

      const { data: contactsData, error: contactsError } = await contactsQuery;

      if (!contactsError && contactsData) {
        // Type cast the contact_enrichment from Json to ContactEnrichment
        const typedContacts: BriefingContact[] = contactsData.map(c => ({
          ...c,
          contact_enrichment: c.contact_enrichment as unknown as ContactEnrichment | null,
        }));
        setContacts(typedContacts);
      }

      setLoading(false);
    }

    fetchBriefing();
  }, [id, user, isAdmin, adminLoading, navigate, toast]);

  const handleContactSubmit = async (data: ContactFormData) => {
    if (!user || !id) return;

    setIsEnriching(true);

    try {
      const ownerId = briefing?.user_id || user.id;
      const { data: result, error } = await supabase.functions.invoke("generate-contact-enrichment", {
        body: {
          briefing_id: id,
          user_id: ownerId,
          ...data,
        },
      });

      if (error) throw error;

      if (result.error) {
        throw new Error(result.error);
      }

      // Refresh contacts
      let refreshContactsQuery = supabase
        .from("briefing_contacts")
        .select("*")
        .eq("briefing_id", id);

      if (!isAdmin) {
        refreshContactsQuery = refreshContactsQuery.eq("user_id", user.id);
      }

      const { data: contactsData } = await refreshContactsQuery;

      if (contactsData) {
        const typedContacts: BriefingContact[] = contactsData.map(c => ({
          ...c,
          contact_enrichment: c.contact_enrichment as unknown as ContactEnrichment | null,
        }));
        setContacts(typedContacts);
      }

      setShowContactForm(false);
      toast({
        title: "Contact Added",
        description: "Contact enrichment generated successfully",
      });
    } catch (error) {
      console.error("Error generating contact enrichment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate contact enrichment",
        variant: "destructive",
      });
    } finally {
      setIsEnriching(false);
    }
  };

  const handleCopy = async (format: "markdown" | "crm" | "json") => {
    if (!briefing?.company_briefing) return;

    let text = "";
    
    switch (format) {
      case "markdown":
        text = briefing.company_briefing_md || JSON.stringify(briefing.company_briefing, null, 2);
        break;
      case "crm":
        const b = briefing.company_briefing;
        text = `Company: ${briefing.company_name}
URL: ${briefing.company_url}

${b.company_snapshot.one_liner}

Industry: ${b.company_snapshot.industry}
Size: ${b.company_snapshot.estimated_size}
Location: ${b.company_snapshot.hq_or_region}

Products/Services: ${b.website_signals.products_services.join(", ")}

Identified Gaps:
${b.identified_gaps.map(g => `- ${g.gap_title}: ${g.why_it_matters}`).join("\n")}

Lead With: ${b.recommended_angle.primary_service_to_lead_with}

Sample Opener: "${b.conversation_hooks.sample_opener_script}"

Discovery Questions:
${b.conversation_hooks.discovery_questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Confidence: ${b.assumptions_and_confidence.confidence_score_0_100}%`;
        break;
      case "json":
        text = JSON.stringify(briefing.company_briefing, null, 2);
        break;
    }

    await navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    toast({ title: "Copied!", description: `Briefing copied as ${format}` });
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleDownloadJson = () => {
    if (!briefing?.company_briefing) return;

    const data = {
      briefing: briefing.company_briefing,
      contacts: contacts.map(c => c.contact_enrichment),
      metadata: {
        company_name: briefing.company_name,
        company_url: briefing.company_url,
        created_at: briefing.created_at,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${briefing.company_name.replace(/\s+/g, "-").toLowerCase()}-briefing.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportHtml = () => {
    if (!briefing?.company_briefing) return;
    const contactForExport = contacts.length > 0 ? contacts[contacts.length - 1] : null;
    try {
      exportBriefingToHtml(
        briefing.company_name,
        briefing.company_url,
        briefing.company_briefing,
        contactForExport?.contact_enrichment,
        briefing.created_at
      );
      toast({ title: "Exported!", description: "HTML brief downloaded successfully" });
    } catch (error) {
      console.error("Error exporting to HTML:", error);
      toast({
        title: "Export Failed",
        description: "Failed to generate HTML brief",
        variant: "destructive",
      });
    }
  };

  const handleExportWord = async () => {
    if (!briefing?.company_briefing) return;
    
    
    const contactForExport = contacts.length > 0 ? contacts[contacts.length - 1] : null;
    
    setIsExportingWord(true);
    try {
      await exportBriefingToWord(
        briefing.company_name,
        briefing.company_url,
        briefing.company_briefing,
        contactForExport?.contact_enrichment,
        briefing.created_at
      );
      toast({ title: "Exported!", description: "Word document downloaded successfully" });
    } catch (error) {
      console.error("Error exporting to Word:", error);
      toast({
        title: "Export Failed",
        description: "Failed to generate Word document",
        variant: "destructive",
      });
    } finally {
      setIsExportingWord(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!briefing) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Briefing not found</p>
        </div>
      </AppLayout>
    );
  }

  const latestContact = contacts.length > 0 ? contacts[contacts.length - 1] : null;
  const isOwner = briefing.user_id === user?.id;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2 mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary">
                <Building2 className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  {briefing.company_name}
                  <a
                    href={briefing.company_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <Badge variant="secondary">{briefing.target_contact_type}</Badge>
                  {briefing.industry && (
                    <span>{briefing.industry}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {format(new Date(briefing.created_at), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </div>

            {/* Export actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy("markdown")}
                className="gap-2"
              >
                {copiedFormat === "markdown" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Markdown
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy("crm")}
                className="gap-2"
              >
                {copiedFormat === "crm" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                CRM Notes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadJson}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                JSON
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleExportWord}
                disabled={isExportingWord}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                {isExportingWord ? "Exporting..." : "Word Doc"}
              </Button>
            </div>
          </div>
        </div>

        {isAdmin && !isOwner && (
          <div className="mb-4 rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
            Admin view. Created by another user.
          </div>
        )}

        {/* Briefing Content */}
        {briefing.company_briefing ? (
          <div className="space-y-8">
            <BriefingDisplay
              briefing={briefing.company_briefing}
              contactEnrichment={latestContact?.contact_enrichment}
              briefingMd={briefing.company_briefing_md || undefined}
              contactMd={latestContact?.contact_enrichment_md || undefined}
            />

            {/* Add Contact Section */}
            {!showContactForm ? (
              <Card className="border-dashed border-2 border-border/50 bg-transparent">
                <CardContent className="flex items-center justify-center py-8">
                  <Button
                    variant="outline"
                    onClick={() => setShowContactForm(true)}
                    className="gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Another Contact
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/30 bg-card/50">
                <CardHeader>
                  <CardTitle>Add Contact Enrichment</CardTitle>
                  <CardDescription>
                    Personalize this briefing for another contact
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContactForm
                    onSubmit={handleContactSubmit}
                    isLoading={isEnriching}
                  />
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowContactForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">
                {briefing.status === "pending" 
                  ? "Briefing is being generated..."
                  : "No briefing data available"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
