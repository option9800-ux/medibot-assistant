import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Pill, Plus, Trash2, Bell, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Medication {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  times: string[];
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  active: boolean;
}

export default function Medications() {
  const { user } = useAuth();
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", dosage: "", frequency: "Once daily", times: "08:00",
    start_date: "", end_date: "", notes: "",
  });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("medications").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setMeds((data as Medication[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleAdd = async () => {
    if (!user || !form.name.trim()) { toast.error("Name is required"); return; }
    const times = form.times.split(",").map(t => t.trim()).filter(Boolean);
    const { error } = await supabase.from("medications").insert({
      user_id: user.id,
      name: form.name.trim(),
      dosage: form.dosage || null,
      frequency: form.frequency || null,
      times,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      notes: form.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Medication added");
    setOpen(false);
    setForm({ name: "", dosage: "", frequency: "Once daily", times: "08:00", start_date: "", end_date: "", notes: "" });
    load();
  };

  const toggleActive = async (m: Medication) => {
    const { error } = await supabase.from("medications").update({ active: !m.active }).eq("id", m.id);
    if (error) toast.error(error.message);
    else load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("medications").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removed"); load(); }
  };

  const enableNotifications = async () => {
    if (!("Notification" in window)) { toast.error("Notifications not supported"); return; }
    const perm = await Notification.requestPermission();
    if (perm === "granted") toast.success("Reminders enabled — keep this tab open");
    else toast.error("Permission denied");
  };

  // Lightweight in-tab reminder ticker
  useEffect(() => {
    const id = setInterval(() => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      meds.forEach(m => {
        if (m.active && m.times?.includes(hhmm)) {
          new Notification(`Time for ${m.name}`, { body: m.dosage || "Take your medication", tag: `${m.id}-${hhmm}` });
        }
      });
    }, 60_000);
    return () => clearInterval(id);
  }, [meds]);

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Pill className="w-6 h-6 text-primary" />Medications</h1>
          <p className="text-sm text-muted-foreground">Track your meds and get daily reminders.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={enableNotifications}><Bell className="w-4 h-4 mr-1" />Enable reminders</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Add medication</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add medication</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Metformin" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Dosage</Label><Input value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} placeholder="500mg" /></div>
                  <div><Label>Frequency</Label><Input value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} /></div>
                </div>
                <div><Label>Times (HH:MM, comma separated)</Label><Input value={form.times} onChange={e => setForm({ ...form, times: e.target.value })} placeholder="08:00, 20:00" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                  <div><Label>End</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
                </div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={handleAdd}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {loading ? <p className="text-muted-foreground">Loading…</p> : meds.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Pill className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No medications yet. Add your first one.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {meds.map(m => (
            <div key={m.id} className="glass-card p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">{m.name} {m.dosage && <span className="text-xs text-muted-foreground">{m.dosage}</span>}</h3>
                  {m.frequency && <p className="text-xs text-muted-foreground">{m.frequency}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={m.active} onCheckedChange={() => toggleActive(m)} />
                  <Button size="icon" variant="ghost" onClick={() => remove(m.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              {m.times?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {m.times.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1"><Clock className="w-3 h-3" />{t}</span>
                  ))}
                </div>
              )}
              {(m.start_date || m.end_date) && (
                <p className="text-xs text-muted-foreground">
                  {m.start_date && format(new Date(m.start_date), "MMM d, yyyy")}
                  {m.end_date && ` → ${format(new Date(m.end_date), "MMM d, yyyy")}`}
                </p>
              )}
              {m.notes && <p className="text-xs text-muted-foreground">{m.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
