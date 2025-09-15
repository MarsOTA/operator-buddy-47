import { Link, useLocation } from "react-router-dom";
import { Shield, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import InstallButton from "./InstallButton";
import { SupabaseNotificationBell } from '@/components/notifications/SupabaseNotificationBell';
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";

const Header = () => {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <header className="bg-header text-header-foreground border-b border-header/20">
      <div className="container flex h-14 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-header-foreground" />
          <span className="font-semibold text-lg tracking-wide">DETELDER EZYSTAFF</span>
        </Link>
        {!roleLoading && isAdmin && (
          <nav className="flex items-center gap-1">
            <Link
              to="/clienti"
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors rounded-md",
                isActive("/clienti") 
                  ? "bg-header-foreground/10 text-header-foreground" 
                  : "text-header-foreground/80 hover:text-header-foreground hover:bg-header-foreground/5"
              )}
            >
              CLIENTI
            </Link>
            <Link
              to="/events"
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors rounded-md",
                isActive("/events") 
                  ? "bg-header-foreground/10 text-header-foreground" 
                  : "text-header-foreground/80 hover:text-header-foreground hover:bg-header-foreground/5"
              )}
            >
              EVENTI
            </Link>
          </nav>
        )}
        <div className="flex items-center gap-3">
          <SupabaseNotificationBell />
          <InstallButton />
          <Button
            onClick={signOut}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-header-foreground/80 hover:text-header-foreground hover:bg-header-foreground/5"
          >
            <LogOut className="h-4 w-4" />
            Esci
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
