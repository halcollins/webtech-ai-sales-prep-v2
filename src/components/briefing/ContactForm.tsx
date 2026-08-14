import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema, ContactFormData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, Linkedin } from "lucide-react";

interface ContactFormProps {
  onSubmit: (data: ContactFormData) => Promise<void>;
  isLoading: boolean;
  defaultValues?: Partial<ContactFormData>;
}

export function ContactForm({ onSubmit, isLoading, defaultValues }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      person_name: defaultValues?.person_name || "",
      person_title: defaultValues?.person_title || "",
      linkedin_url: defaultValues?.linkedin_url || "",
      linkedin_text: defaultValues?.linkedin_text || "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </div>
          <CardDescription>
            Enrich the briefing for a specific person
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="person_name">
                Person Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="person_name"
                placeholder="Jane Smith"
                {...register("person_name")}
                className="bg-secondary/50"
              />
              {errors.person_name && (
                <p className="text-sm text-destructive">{errors.person_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="person_title">Title (Optional)</Label>
              <Input
                id="person_title"
                placeholder="Chief Technology Officer"
                {...register("person_title")}
                className="bg-secondary/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin_url">
              <span className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn URL <span className="text-destructive">*</span>
              </span>
            </Label>
            <Input
              id="linkedin_url"
              placeholder="https://linkedin.com/in/janesmith"
              {...register("linkedin_url")}
              className="bg-secondary/50"
            />
            {errors.linkedin_url && (
              <p className="text-sm text-destructive">{errors.linkedin_url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin_text">
              LinkedIn Summary (Optional)
            </Label>
            <Textarea
              id="linkedin_text"
              placeholder="Paste headline, about section, or summary here if you want better accuracy. We never scrape LinkedIn — only use what you provide."
              {...register("linkedin_text")}
              className="bg-secondary/50 min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Tip: Copy their headline, about section, or experience highlights for best results
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="gap-2 min-w-[200px] shadow-glow"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Enriching Contact...
            </>
          ) : (
            <>
              <User className="h-5 w-5" />
              Generate Contact Prep
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
