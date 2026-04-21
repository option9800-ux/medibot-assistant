import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Calendar as CalIcon, Plus, Trash2, MapPin, Stethoscope, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format, isAfter, isBefore } from "date-fns";

interface Appointment {
  id: string;
  title: string;
  doctor_name: string | null;
  specialty: string | null;
  location: string | null;
  scheduled_at: string;
  notes: string | null;
  status: string;
}

export default function Appointments() {
  const { user } = useAuth();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", doctor_name: "", specialty: "", location: "", scheduled_at: "", notes: "",
  });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("appointments").select("*").order("scheduled_at", { ascending: true });
    if (error) toast.error(error.message);
    else setAppts((data as Appointment[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleAdd = async () => {
    if (!user || !form.title.trim() || !form.scheduled_at) { toast.error("Title and date are required"); return; }
    const { error } = await supabase.from("appointments").insert({
      user_id: user.id,
      title: form.title.trim(),
      doctor_name: form.doctor_name || null,
      specialty: form.specialty || null,
      location: form.location || null,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      notes: form.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Appointment scheduled");
    setOpen(false);
    setForm({ title: "", doctor_name: "", specialty: "", location: "", scheduled_at: "", notes: "" });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Removed"); load(); }
  };

  const now = new Date();
  const upcoming = useMemo(() => appts.filter(a => a.status === "scheduled" && isAfter(new Date(a.scheduled_at), now)), [appts]);
  const past = useMemo(() => appts.filter(a => a.status !== "scheduled" || isBefore(new Date(a.scheduled_at), now)), [appts]);

  const renderApp = (a: Appointment) => (
    <div key={a.id} className="glass-card p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{a.title}</h3>
          <p className="text-xs text-muted-foreground">{format(new Date(a.scheduled_at), "PPp")}</p>
          {(a.doctor_name || a.specialty) && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Stethoscope className="w-3 h-3" />{a.doctor_name}{a.specialty && ` · ${a.specialty}`}</p>
          )}
          {a.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{a.location}</p>}
          {a.notes && <p className="text-xs mt-1">{a.notes}</p>}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {a.status === "scheduled" && (
            <Button size="icon" variant="ghost" title="Mark complete" onClick={() => updateStatus(a.id, "completed")}><CheckCircle2 className="w-4 h-4 text-health-green" /></Button>
          )}
          <Button size="icon" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>
      <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full self-start ${a.status === "completed" ? "bg-health-green/15 text-health-green" : a.status === "cancelled" ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"}`}>{a.status}</span>
    </div>
  );

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CalIcon className="w-6 h-6 text-primary" />Appointments</h1>
          <p className="text-sm text-muted-foreground">Schedule and manage your doctor visits.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />New appointment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule appointment</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Annual check-up" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Doctor</Label><Input value={form.doctor_name} onChange={e => setForm({ ...form, doctor_name: e.target.value })} /></div>
                <div><Label>Specialty</Label><Input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} /></div>
              </div>
              <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label>Date & Time *</Label><Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} /></div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={handleAdd}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {loading ? <p className="text-muted-foreground">Loading…</p> : (
        <>
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Upcoming ({upcoming.length})</h2>
            {upcoming.length === 0 ? <div className="glass-card p-6 text-center text-sm text-muted-foreground">No upcoming appointments.</div> : (
              <div className="grid gap-3 md:grid-cols-2">{upcoming.map(renderApp)}</div>
            )}
          </section>
          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Past ({past.length})</h2>
              <div className="grid gap-3 md:grid-cols-2 opacity-70">{past.map(renderApp)}</div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
