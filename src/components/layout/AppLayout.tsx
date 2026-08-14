import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, FileText, Plus } from "lucide-react";
interface AppLayoutProps {
  children: ReactNode;
}
export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          {/* Top row: Logo and Account */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-gold shadow-glow">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="tracking-tight font-medium text-lg">​WebTECH</h1>
                <p className="text-xs text-muted-foreground text-center">Call Prep AI</p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              {/* Desktop-only New Briefing button */}
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate("/briefings/new")}
                className="hidden gap-2 md:flex"
              >
                <Plus className="h-4 w-4" />
                New Briefing
              </Button>

              <div className="flex items-center gap-3 md:border-l md:border-border md:pl-4">
                <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
                <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile-only: Full-width New Briefing button */}
          <Button variant="default" onClick={() => navigate("/briefings/new")} className="mt-3 w-full gap-2 md:hidden">
            <Plus className="h-4 w-4" />
            New Briefing
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">{children}</main>

      {/* Footer disclaimer */}
      <footer className="border-t border-border/50 py-4">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs text-muted-foreground">
            AI-assisted briefing. Validate in discovery. • WebTECH AI Consulting, Tulsa OK
          </p>
        </div>
      </footer>
    </div>
  );
}
