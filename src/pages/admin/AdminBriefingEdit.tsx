import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Save, Loader2 } from "lucide-react";

interface BriefingData {
  id: string;
  company_name: string;
  company_url: string;
  target_contact_type: string;
  industry: string | null;
  meeting_type: string | null;
  region: string | null;
  known_pain: string | null;
  notes: string | null;
  status: string;
}

export default function AdminBriefingEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<BriefingData | null>(null);

  useEffect(() => {
    async function fetchBriefing() {
      const isUuid = !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (!isUuid) {
        setLoading(false);
        return;
      }


      const { data, error } = await supabase
        .from("briefings")
        .select("id, company_name, company_url, target_contact_type, industry, meeting_type, region, known_pain, notes, status")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        console.error("Error fetching briefing:", error);
        toast({
          title: "Error",
          description: "Briefing not found",
          variant: "destructive",
        });
        navigate("/admin/briefings");
        return;
      }

      setFormData(data);
      setLoading(false);
    }

    fetchBriefing();
  }, [id, navigate, toast]);

  const handleSave = async () => {
    if (!formData) return;

    setSaving(true);

    const { error } = await supabase
      .from("briefings")
      .update({
        company_name: formData.company_name,
        company_url: formData.company_url,
        target_contact_type: formData.target_contact_type,
        industry: formData.industry,
        meeting_type: formData.meeting_type,
        region: formData.region,
        known_pain: formData.known_pain,
        notes: formData.notes,
        status: formData.status,
      })
      .eq("id", formData.id);

    if (error) {
      console.error("Error saving briefing:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Saved",
        description: "Briefing updated successfully",
      });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!formData) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Briefing not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/briefings")}
          className="gap-2 mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Briefings
        </Button>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Edit Briefing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_url">Company URL</Label>
                <Input
                  id="company_url"
                  value={formData.company_url}
                  onChange={(e) => setFormData({ ...formData, company_url: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="target_contact_type">Target Contact Type</Label>
                <Input
                  id="target_contact_type"
                  value={formData.target_contact_type}
                  onChange={(e) => setFormData({ ...formData, target_contact_type: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry || ""}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value || null })}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting_type">Meeting Type</Label>
                <Input
                  id="meeting_type"
                  value={formData.meeting_type || ""}
                  onChange={(e) => setFormData({ ...formData, meeting_type: e.target.value || null })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={formData.region || ""}
                onChange={(e) => setFormData({ ...formData, region: e.target.value || null })}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="known_pain">Known Pain Points</Label>
              <Textarea
                id="known_pain"
                value={formData.known_pain || ""}
                onChange={(e) => setFormData({ ...formData, known_pain: e.target.value || null })}
                placeholder="Optional"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
                placeholder="Optional"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button variant="outline" onClick={() => navigate("/admin/briefings")}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
