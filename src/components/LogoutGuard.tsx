import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutGuard({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (!user) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "You are still logged in. Are you sure you want to leave?";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    setShowDialog(false);
    navigate("/login");
  };

  return (
    <>
      {children}

      {/* Floating logout button when logged in */}
      {user && (
        <button
          onClick={() => setShowDialog(true)}
          className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-destructive/90 text-destructive-foreground shadow-lg hover:bg-destructive transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-primary">Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of MediBot?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
