import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Users, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Stats {
  totalBriefings: number;
  readyBriefings: number;
  pendingBriefings: number;
  failedBriefings: number;
  totalUsers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      // Fetch all briefings
      const { data: briefings, error: briefingsError } = await supabase
        .from("briefings")
        .select("status, user_id");

      if (briefingsError) {
        console.error("Error fetching briefings:", briefingsError);
        setLoading(false);
        return;
      }

      const uniqueUsers = new Set(briefings?.map(b => b.user_id) || []);
      
      setStats({
        totalBriefings: briefings?.length || 0,
        readyBriefings: briefings?.filter(b => b.status === "ready").length || 0,
        pendingBriefings: briefings?.filter(b => b.status === "pending").length || 0,
        failedBriefings: briefings?.filter(b => b.status === "failed").length || 0,
        totalUsers: uniqueUsers.size,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Briefings",
      value: stats?.totalBriefings || 0,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Ready",
      value: stats?.readyBriefings || 0,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Pending",
      value: stats?.pendingBriefings || 0,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Failed",
      value: stats?.failedBriefings || 0,
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage all briefings across the platform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {statCards.map((stat) => (
            <Card key={stat.title} className="border-border/50 bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-2">
          <Link to="/admin/briefings">
            <Card className="border-border/50 bg-card/50 hover:bg-card/80 hover:border-primary/30 transition-all cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Manage Briefings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  View, edit, and delete all user briefings
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/users">
            <Card className="border-border/50 bg-card/50 hover:bg-card/80 hover:border-primary/30 transition-all cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  View Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  See user activity and briefing counts
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
