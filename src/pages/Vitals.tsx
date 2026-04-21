import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Plus, Trash2, Heart, Droplet, Thermometer, Weight as WeightIcon, Wind } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface Vital {
  id: string;
  type: string;
  value_numeric: number | null;
  value_secondary: number | null;
  unit: string | null;
  notes: string | null;
  recorded_at: string;
}

const VITAL_TYPES: Record<string, { label: string; unit: string; icon: any; color: string; secondary?: string }> = {
  blood_pressure: { label: "Blood Pressure", unit: "mmHg", icon: Heart, color: "hsl(var(--health-red))", secondary: "diastolic" },
  heart_rate: { label: "Heart Rate", unit: "bpm", icon: Activity, color: "hsl(var(--health-pink))" },
  blood_sugar: { label: "Blood Sugar", unit: "mg/dL", icon: Droplet, color: "hsl(var(--health-amber))" },
  weight: { label: "Weight", unit: "kg", icon: WeightIcon, color: "hsl(var(--health-blue))" },
  temperature: { label: "Temperature", unit: "°C", icon: Thermometer, color: "hsl(var(--health-orange))" },
  oxygen: { label: "Oxygen (SpO2)", unit: "%", icon: Wind, color: "hsl(var(--health-green))" },
};

export default function Vitals() {
  const { user } = useAuth();
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("blood_pressure");
  const [form, setForm] = useState({ type: "blood_pressure", value_numeric: "", value_secondary: "", notes: "" });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("vitals").select("*").order("recorded_at", { ascending: false }).limit(200);
    if (error) toast.error(error.message);
    else setVitals((data as Vital[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleAdd = async () => {
    if (!user || !form.value_numeric) { toast.error("Value is required"); return; }
    const meta = VITAL_TYPES[form.type];
    const { error } = await supabase.from("vitals").insert({
      user_id: user.id,
      type: form.type,
      value_numeric: parseFloat(form.value_numeric),
      value_secondary: form.value_secondary ? parseFloat(form.value_secondary) : null,
      unit: meta.unit,
      notes: form.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Reading saved");
    setOpen(false);
    setForm({ type: form.type, value_numeric: "", value_secondary: "", notes: "" });
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("vitals").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Removed"); load(); }
  };

  const filtered = useMemo(() => vitals.filter(v => v.type === activeTab), [vitals, activeTab]);
  const chartData = useMemo(() =>
    [...filtered].reverse().map(v => ({
      time: format(new Date(v.recorded_at), "MMM d"),
      value: v.value_numeric,
      secondary: v.value_secondary,
    })), [filtered]);

  const meta = VITAL_TYPES[activeTab];

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="w-6 h-6 text-primary" />Vitals Tracker</h1>
          <p className="text-sm text-muted-foreground">Log readings and watch trends over time.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Log reading</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log a vital reading</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(VITAL_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{VITAL_TYPES[form.type].secondary ? "Systolic" : "Value"} ({VITAL_TYPES[form.type].unit})</Label>
                  <Input type="number" step="0.1" value={form.value_numeric} onChange={e => setForm({ ...form, value_numeric: e.target.value })} />
                </div>
                {VITAL_TYPES[form.type].secondary && (
                  <div>
                    <Label>Diastolic</Label>
                    <Input type="number" step="0.1" value={form.value_secondary} onChange={e => setForm({ ...form, value_secondary: e.target.value })} />
                  </div>
                )}
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={handleAdd}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto">
          {Object.entries(VITAL_TYPES).map(([k, v]) => (
            <TabsTrigger key={k} value={k} className="text-xs">
              <v.icon className="w-3.5 h-3.5 mr-1" />{v.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><meta.icon className="w-4 h-4" style={{ color: meta.color }} />{meta.label} trend</h3>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">No readings yet for {meta.label.toLowerCase()}.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="value" stroke={meta.color} strokeWidth={2} dot={{ r: 3 }} />
                {meta.secondary && <Line type="monotone" dataKey="secondary" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={{ r: 3 }} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {loading ? <p className="text-muted-foreground">Loading…</p> : (
        <div className="space-y-2">
          {filtered.map(v => (
            <div key={v.id} className="glass-card p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {v.value_numeric}{v.value_secondary ? ` / ${v.value_secondary}` : ""} <span className="text-xs text-muted-foreground">{v.unit}</span>
                </p>
                <p className="text-xs text-muted-foreground">{format(new Date(v.recorded_at), "PPp")}{v.notes && ` · ${v.notes}`}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(v.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
