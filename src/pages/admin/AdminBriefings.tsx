import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Pencil, Trash2, ExternalLink, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { format } from "date-fns";

interface Briefing {
  id: string;
  company_name: string;
  company_url: string;
  target_contact_type: string;
  status: string;
  confidence_score: number | null;
  created_at: string;
  user_id: string;
}

const PAGE_SIZE = 20;

export default function AdminBriefings() {
  const { toast } = useToast();
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchBriefings() {
    setLoading(true);
    
    let query = supabase
      .from("briefings")
      .select("id, company_name, company_url, target_contact_type, status, confidence_score, created_at, user_id", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search) {
      query = query.ilike("company_name", `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching briefings:", error);
      toast({
        title: "Error",
        description: "Failed to load briefings",
        variant: "destructive",
      });
    } else {
      setBriefings(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchBriefings();
  }, [page, search]);

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    
    // First delete related contacts
    await supabase.from("briefing_contacts").delete().eq("briefing_id", deleteId);
    
    // Then delete the briefing
    const { error } = await supabase.from("briefings").delete().eq("id", deleteId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete briefing",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Briefing deleted successfully",
      });
      fetchBriefings();
    }

    setDeleting(false);
    setDeleteId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return <Badge className="bg-success/20 text-success border-success/30">Ready</Badge>;
      case "pending":
        return <Badge className="bg-primary/20 text-primary border-primary/30">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Briefings</h1>
            <p className="text-muted-foreground mt-1">
              {totalCount} briefings total
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by company name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-10"
            />
          </div>
        </div>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : briefings.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">
                  {search ? "No briefings match your search" : "No briefings found"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {briefings.map((briefing) => (
                    <TableRow key={briefing.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{briefing.company_name}</span>
                          <a
                            href={briefing.company_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>{briefing.target_contact_type}</TableCell>
                      <TableCell>{getStatusBadge(briefing.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(briefing.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/briefings/${briefing.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="View briefing">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link to={`/admin/briefings/${briefing.id}/edit`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(briefing.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Briefing?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this briefing and all associated contacts. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
