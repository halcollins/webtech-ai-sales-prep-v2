import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { StepIndicator } from "@/components/briefing/StepIndicator";
import { CompanyForm } from "@/components/briefing/CompanyForm";
import { ContactForm } from "@/components/briefing/ContactForm";
import { BriefingDisplay } from "@/components/briefing/BriefingDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CompanyFormData, ContactFormData, CompanyBriefing, ContactEnrichment } from "@/lib/schemas";
import { ArrowRight, SkipForward, RefreshCw, ChevronLeft } from "lucide-react";

const steps = [
  { number: 1, title: "Company Details", description: "Enter company info" },
  { number: 2, title: "Contact Enrichment", description: "Optional personalization" },
];

export default function NewBriefing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [briefingId, setBriefingId] = useState<string | null>(null);
  const [companyBriefing, setCompanyBriefing] = useState<CompanyBriefing | null>(null);
  const [contactEnrichment, setContactEnrichment] = useState<ContactEnrichment | null>(null);
  const [lastCompanyData, setLastCompanyData] = useState<CompanyFormData | null>(null);
  const [lastContactData, setLastContactData] = useState<ContactFormData | null>(null);

  const handleCompanySubmit = async (data: CompanyFormData) => {
    if (!user) return;
    
    setIsGenerating(true);
    setLastCompanyData(data);

    try {
      const { data: result, error } = await supabase.functions.invoke("generate-company-briefing", {
        body: data, // user_id is derived from JWT on server side
      });

      if (error) throw error;

      if (result.error) {
        throw new Error(result.error);
      }

      setBriefingId(result.briefing_id);
      setCompanyBriefing(result.company_briefing);
      setCurrentStep(2);
      
      toast({
        title: "Briefing Generated",
        description: `Company briefing ready with ${result.company_briefing.assumptions_and_confidence.confidence_score_0_100}% confidence`,
      });
    } catch (error) {
      console.error("Error generating briefing:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate briefing",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContactSubmit = async (data: ContactFormData) => {
    if (!user || !briefingId) return;

    setIsGenerating(true);
    setLastContactData(data);

    try {
      const { data: result, error } = await supabase.functions.invoke("generate-contact-enrichment", {
        body: { 
          briefing_id: briefingId,
          ...data // user_id is derived from JWT on server side
        },
      });

      if (error) throw error;

      if (result.error) {
        throw new Error(result.error);
      }

      setContactEnrichment(result.contact_enrichment);
      
      toast({
        title: "Contact Enrichment Complete",
        description: "Personalized prep added to your briefing",
      });
    } catch (error) {
      console.error("Error generating contact enrichment:", error);
      toast({
        title: "Enrichment Failed",
        description: error instanceof Error ? error.message : "Failed to generate contact enrichment",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (lastCompanyData) {
      setCompanyBriefing(null);
      setContactEnrichment(null);
      setBriefingId(null);
      setCurrentStep(1);
      await handleCompanySubmit(lastCompanyData);
    }
  };

  const handleSkipContact = () => {
    if (briefingId) {
      navigate(`/briefings/${briefingId}`);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
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
          <h1 className="text-2xl font-bold">New Briefing</h1>
          <p className="text-muted-foreground mt-1">
            Generate an AI-powered call prep briefing
          </p>
        </div>

        <StepIndicator steps={steps} currentStep={currentStep} />

        {currentStep === 1 && !companyBriefing && (
          <CompanyForm
            onSubmit={handleCompanySubmit}
            isLoading={isGenerating}
            defaultValues={lastCompanyData || undefined}
          />
        )}

        {currentStep === 2 && companyBriefing && (
          <div className="space-y-8">
            {/* Show generated briefing */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Generated Briefing</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </Button>
              </div>
              <BriefingDisplay 
                briefing={companyBriefing}
                contactEnrichment={contactEnrichment}
              />
            </div>

            {/* Contact enrichment form or completion options */}
            {!contactEnrichment ? (
              <Card className="border-primary/30 bg-card/50">
                <CardHeader>
                  <CardTitle>Add Contact Enrichment</CardTitle>
                  <CardDescription>
                    Optionally personalize this briefing for a specific person
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContactForm
                    onSubmit={handleContactSubmit}
                    isLoading={isGenerating}
                    defaultValues={lastContactData || undefined}
                  />
                  
                  <div className="mt-6 pt-6 border-t border-border/50 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={handleSkipContact}
                      className="gap-2"
                    >
                      <SkipForward className="h-4 w-4" />
                      Skip & View Briefing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={() => navigate(`/briefings/${briefingId}`)}
                  className="gap-2 shadow-glow"
                >
                  View Full Briefing
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
