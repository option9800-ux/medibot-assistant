import { useState } from "react";
import { Settings as SettingsIcon, Sun, Moon, Trash2, AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isLight = theme === "light";

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Best-effort cleanup of user-owned rows (RLS limits to own data)
      await Promise.all([
        supabase.from("medications").delete().eq("user_id", user.id),
        supabase.from("vitals").delete().eq("user_id", user.id),
        supabase.from("appointments").delete().eq("user_id", user.id),
        supabase.from("emergency_contacts").delete().eq("user_id", user.id),
      ]);

      // Clear local data
      Object.keys(localStorage)
        .filter((k) => k.startsWith("mediassist-"))
        .forEach((k) => localStorage.removeItem(k));

      await signOut();
      toast.success("Your data has been removed and you've been signed out.");
      navigate("/login");
    } catch (e) {
      console.error(e);
      toast.error("Could not fully delete account. Please contact support.");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage appearance and account</p>
          </div>
        </div>

        {/* Appearance */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            {isLight ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4 text-primary" />}
            Appearance
          </h2>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                {isLight ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4 text-primary" />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{isLight ? "Light mode" : "Dark mode"}</p>
                <p className="text-xs text-muted-foreground">
                  {isLight ? "Bright, clean interface" : "Easy on the eyes in low light"}
                </p>
              </div>
            </div>
            <Switch checked={isLight} onCheckedChange={toggleTheme} aria-label="Toggle theme" />
          </div>
        </div>

        {/* Account */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Account</h2>
          {user && (
            <div className="text-sm text-muted-foreground">
              Signed in as <span className="text-foreground font-medium">{user.email}</span>
            </div>
          )}
          <Button variant="outline" className="w-full sm:w-auto" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-1.5" /> Sign out
          </Button>
        </div>

        {/* Danger zone */}
        <div className="glass-card p-6 space-y-4 border border-destructive/30">
          <h2 className="font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Danger zone
          </h2>
          <p className="text-sm text-muted-foreground">
            Permanently delete your medical records, medications, vitals, appointments, and emergency contacts. This action cannot be undone.
          </p>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="w-4 h-4 mr-1.5" /> Delete my account data
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will erase all your medications, vitals, appointments, emergency contacts, and local profile data, then sign you out. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Yes, delete everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
