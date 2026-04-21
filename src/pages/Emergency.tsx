import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Phone, Plus, Trash2, AlertTriangle, MapPin, Star } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  relationship: string | null;
  phone: string;
  is_primary: boolean;
}

const AMBULANCE_NUMBERS: Record<string, string> = {
  "🇺🇸 US/Canada": "911",
  "🇮🇳 India": "112",
  "🇬🇧 UK": "999",
  "🇪🇺 EU": "112",
  "🇦🇺 Australia": "000",
};

export default function Emergency() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", relationship: "", phone: "", is_primary: false });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("emergency_contacts").select("*").order("is_primary", { ascending: false });
    if (error) toast.error(error.message);
    else setContacts((data as Contact[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleAdd = async () => {
    if (!user || !form.name.trim() || !form.phone.trim()) { toast.error("Name and phone required"); return; }
    if (form.is_primary) {
      await supabase.from("emergency_contacts").update({ is_primary: false }).eq("user_id", user.id);
    }
    const { error } = await supabase.from("emergency_contacts").insert({
      user_id: user.id,
      name: form.name.trim(),
      relationship: form.relationship || null,
      phone: form.phone.trim(),
      is_primary: form.is_primary,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Contact added");
    setOpen(false);
    setForm({ name: "", relationship: "", phone: "", is_primary: false });
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Removed"); load(); }
  };

  const setPrimary = async (id: string) => {
    if (!user) return;
    await supabase.from("emergency_contacts").update({ is_primary: false }).eq("user_id", user.id);
    await supabase.from("emergency_contacts").update({ is_primary: true }).eq("id", id);
    load();
  };

  const shareLocation = async () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
        navigator.clipboard.writeText(url);
        toast.success("Location link copied — paste it in a message");
      },
      () => toast.error("Could not get location")
    );
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-health-red" />Emergency SOS</h1>
          <p className="text-sm text-muted-foreground">One-tap access to help when seconds matter.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Add contact</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add emergency contact</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Relationship</Label><Input value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })} placeholder="Spouse, parent…" /></div>
              <div><Label>Phone *</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 123 4567" /></div>
              <div className="flex items-center gap-3"><Switch checked={form.is_primary} onCheckedChange={v => setForm({ ...form, is_primary: v })} /><Label>Set as primary</Label></div>
            </div>
            <DialogFooter><Button onClick={handleAdd}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <section className="glass-card p-5 border-2 border-health-red/30 bg-health-red/5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-health-red mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Emergency services</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {Object.entries(AMBULANCE_NUMBERS).map(([country, num]) => (
            <a key={country} href={`tel:${num}`} className="glass-card p-3 text-center hover:bg-health-red/10 transition-colors">
              <p className="text-xs text-muted-foreground">{country}</p>
              <p className="font-bold text-health-red text-lg">{num}</p>
            </a>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={shareLocation}>
          <MapPin className="w-4 h-4 mr-1" />Copy my location link
        </Button>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Personal contacts</h2>
        {loading ? <p className="text-muted-foreground">Loading…</p> : contacts.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Phone className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Add the people responders should call first.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {contacts.map(c => (
              <div key={c.id} className="glass-card p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold flex items-center gap-2 truncate">
                    {c.is_primary && <Star className="w-4 h-4 fill-health-amber text-health-amber" />}
                    {c.name}
                  </h3>
                  {c.relationship && <p className="text-xs text-muted-foreground">{c.relationship}</p>}
                  <p className="text-sm text-primary">{c.phone}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a href={`tel:${c.phone}`}><Button size="icon" variant="ghost" title="Call"><Phone className="w-4 h-4 text-health-green" /></Button></a>
                  {!c.is_primary && <Button size="icon" variant="ghost" title="Make primary" onClick={() => setPrimary(c.id)}><Star className="w-4 h-4" /></Button>}
                  <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
