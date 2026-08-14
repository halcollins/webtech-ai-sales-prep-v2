import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Users, FileText, Shield, ShieldPlus, ShieldMinus, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  briefing_count: number;
  latest_briefing: string | null;
  roles: string[];
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ userId: string; email: string; action: "promote" | "demote" } | null>(null);

  async function fetchUsers() {
    const { data, error } = await supabase.functions.invoke("get-admin-users");

    if (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setUsers(data.users || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async () => {
    if (!confirmAction) return;

    setActionLoading(confirmAction.userId);

    const { data, error } = await supabase.functions.invoke("manage-user-role", {
      body: {
        user_id: confirmAction.userId,
        action: confirmAction.action,
      },
    });

    if (error || data?.error) {
      toast({
        title: "Error",
        description: data?.error || "Failed to update role",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: confirmAction.action === "promote" 
          ? `${confirmAction.email} is now an admin`
          : `Admin role removed from ${confirmAction.email}`,
      });
      // Refresh the user list
      await fetchUsers();
    }

    setActionLoading(null);
    setConfirmAction(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">
            {users.length} registered users
          </p>
        </div>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Briefings</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const isAdmin = user.roles.includes("admin");
                    const isCurrentUser = user.id === currentUser?.id;
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <span className="font-medium">{user.email}</span>
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <Badge className="bg-destructive/20 text-destructive border-destructive/30 gap-1">
                              <Shield className="h-3 w-3" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary">User</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            <FileText className="h-3 w-3" />
                            {user.briefing_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.last_sign_in_at
                            ? format(new Date(user.last_sign_in_at), "MMM d, yyyy")
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(user.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          {actionLoading === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                          ) : isCurrentUser ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : isAdmin ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-destructive hover:text-destructive"
                              onClick={() => setConfirmAction({ userId: user.id, email: user.email, action: "demote" })}
                            >
                              <ShieldMinus className="h-4 w-4" />
                              Demote
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={() => setConfirmAction({ userId: user.id, email: user.email, action: "promote" })}
                            >
                              <ShieldPlus className="h-4 w-4" />
                              Promote
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmAction?.action === "promote" ? "Promote to Admin?" : "Remove Admin Role?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction?.action === "promote"
                  ? `This will give ${confirmAction?.email} full admin access to view and manage all briefings and users.`
                  : `This will remove admin privileges from ${confirmAction?.email}. They will only be able to access their own briefings.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRoleChange}
                className={confirmAction?.action === "demote" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              >
                {confirmAction?.action === "promote" ? "Promote" : "Demote"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
