import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Building2, Clock, ArrowRight, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface Briefing {
  id: string;
  company_name: string;
  company_url: string;
  target_contact_type: string;
  status: string;
  confidence_score: number | null;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBriefings() {
      if (!user) return;

      const { data, error } = await supabase
        .from("briefings")
        .select("id, company_name, company_url, target_contact_type, status, confidence_score, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching briefings:", error);
      } else {
        setBriefings(data || []);
      }
      setLoading(false);
    }

    fetchBriefings();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return <Badge className="bg-success/20 text-success border-success/30">Ready</Badge>;
      case "pending":
        return <Badge className="bg-primary/20 text-primary border-primary/30">Generating</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Call Briefings</h1>
          <p className="mt-1 text-muted-foreground">
            AI-powered company research for recruiters and sales
          </p>
        </div>

        {/* Empty State or Briefings List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border/50 bg-card/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-9 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : briefings.length === 0 ? (
          <Card className="border-border/50 bg-gradient-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="mb-2">No briefings yet</CardTitle>
              <CardDescription className="mb-6 text-center max-w-md">
                Create your first AI-powered company briefing to prepare for calls with prospects
              </CardDescription>
              <Button onClick={() => navigate("/briefings/new")} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Briefing
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {briefings.map((briefing, index) => (
              <Link
                key={briefing.id}
                to={`/briefings/${briefing.id}`}
                className="block"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card className="border-border/50 bg-card/50 hover:bg-card/80 hover:border-primary/30 transition-all duration-200 group">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold truncate">
                            {briefing.company_name}
                          </h3>
                          {getStatusBadge(briefing.status)}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{briefing.target_contact_type}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(briefing.created_at), "MMM d, yyyy")}
                          </span>
                          {briefing.confidence_score !== null && (
                            <span className="text-primary">
                              {briefing.confidence_score}% confidence
                            </span>
                          )}
                        </div>
                      </div>

                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
