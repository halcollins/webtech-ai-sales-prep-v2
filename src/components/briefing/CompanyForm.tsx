import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companyFormSchema, CompanyFormData, industries, regions, leadSources } from "@/lib/schemas";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Building2, Target } from "lucide-react";

interface CompanyFormProps {
  onSubmit: (data: CompanyFormData) => Promise<void>;
  isLoading: boolean;
  defaultValues?: Partial<CompanyFormData>;
}

export function CompanyForm({ onSubmit, isLoading, defaultValues }: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      company_name: defaultValues?.company_name || "",
      company_url: defaultValues?.company_url || "",
      target_contact_type: defaultValues?.target_contact_type || "",
      lead_source: defaultValues?.lead_source,
      initial_interest: defaultValues?.initial_interest || "",
      industry: defaultValues?.industry || "",
      meeting_type: defaultValues?.meeting_type,
      known_pain: defaultValues?.known_pain || "",
      region: defaultValues?.region || "",
      notes: defaultValues?.notes || "",
    },
  });

  const [buyerRoles, setBuyerRoles] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("company_profile").select("buyer_roles").limit(1).maybeSingle();
      if (!active) return;
      const roles = Array.isArray(data?.buyer_roles)
        ? (data!.buyer_roles as unknown[]).filter((r): r is string => typeof r === "string" && r.length > 0)
        : [];
      setBuyerRoles(roles);
      setRolesLoading(false);
      if (!defaultValues?.target_contact_type && roles.length > 0) {
        setValue("target_contact_type", roles[0]);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const watchedIndustry = watch("industry");
  const watchedLeadSource = watch("lead_source");
  const watchedContactType = watch("target_contact_type");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Required Fields */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Company Details</CardTitle>
          </div>
          <CardDescription>Required information for the briefing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="company_name"
                placeholder="Acme Corp"
                {...register("company_name")}
                className="bg-secondary/50"
              />
              {errors.company_name && <p className="text-sm text-destructive">{errors.company_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_url">
                Company Website <span className="text-destructive">*</span>
              </Label>
              <Input
                id="company_url"
                placeholder="https://acme.com"
                {...register("company_url")}
                className="bg-secondary/50"
              />
              {errors.company_url && <p className="text-sm text-destructive">{errors.company_url.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_contact_type">
              Target Contact Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watchedContactType || ""}
              disabled={rolesLoading || buyerRoles.length === 0}
              onValueChange={(value) => setValue("target_contact_type", value)}
            >
              <SelectTrigger className="bg-secondary/50">
                <SelectValue
                  placeholder={
                    rolesLoading
                      ? "Loading roles..."
                      : buyerRoles.length === 0
                        ? "No buyer roles configured. Contact your admin."
                        : "Select contact type"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {buyerRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.target_contact_type && (
              <p className="text-sm text-destructive">{errors.target_contact_type.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Optional Fields */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Context (Optional)</CardTitle>
          </div>
          <CardDescription>Additional details improve briefing quality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* NEW: Lead Source */}
          <div className="space-y-2">
            <Label htmlFor="lead_source">How did you find this company?</Label>
            <Select value={watchedLeadSource || ""} onValueChange={(value) => setValue("lead_source", value as any)}>
              <SelectTrigger className="bg-secondary/50">
                <SelectValue placeholder="Select lead source" />
              </SelectTrigger>
              <SelectContent>
                {leadSources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* NEW: Initial Interest */}
          <div className="space-y-2">
            <Label htmlFor="initial_interest">What made you think they might be a fit?</Label>
            <Textarea
              id="initial_interest"
              placeholder="e.g., Saw they posted 5 developer roles last month, or heard they're expanding their IT team..."
              {...register("initial_interest")}
              className="bg-secondary/50 min-h-[80px]"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={watchedIndustry || ""} onValueChange={(value) => setValue("industry", value)}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting_type">Meeting Type</Label>
              <Select onValueChange={(value) => setValue("meeting_type", value as any)}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select meeting type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Intro call">Intro call</SelectItem>
                  <SelectItem value="Discovery">Discovery</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Region/Coverage</Label>
            <Select onValueChange={(value) => setValue("region", value)}>
              <SelectTrigger className="bg-secondary/50">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="known_pain">Known Pain Points</Label>
            <Textarea
              id="known_pain"
              placeholder="Any challenges or pain points you've heard about..."
              {...register("known_pain")}
              className="bg-secondary/50 min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any other context that might be helpful..."
              {...register("notes")}
              className="bg-secondary/50 min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isLoading} className="gap-2 min-w-[200px] shadow-glow">
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating Briefing...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Generate Briefing
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
