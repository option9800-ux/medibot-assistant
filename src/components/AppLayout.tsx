import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border px-3 glass">
            <SidebarTrigger className="mr-2" />
            <div className="flex-1" />
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[160px]">
                  {user.email}
                </span>
                <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </header>
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
