import { useState, useEffect } from "react";
import { UserCircle, Save, Plus, X, Droplets, AlertTriangle, Heart, Calendar, Ruler, Weight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PatientProfile {
  name: string;
  age: string;
  gender: string;
  bloodGroup: string;
  height: string;
  weight: string;
  allergies: string[];
  chronicConditions: string[];
  pastSurgeries: string[];
  currentMedications: string[];
  emergencyContact: string;
  notes: string;
}

const STORAGE_KEY = "mediassist-patient-profile";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const defaultProfile: PatientProfile = {
  name: "",
  age: "",
  gender: "",
  bloodGroup: "",
  height: "",
  weight: "",
  allergies: [],
  chronicConditions: [],
  pastSurgeries: [],
  currentMedications: [],
  emergencyContact: "",
  notes: "",
};

function TagInput({
  label,
  icon: Icon,
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  label: string;
  icon: React.ElementType;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
      setInput("");
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        {label}
      </label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
          placeholder={placeholder}
          className="bg-muted/50"
        />
        <Button type="button" size="icon" variant="outline" onClick={handleAdd} disabled={!input.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button onClick={() => onRemove(i)} className="ml-1 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState<PatientProfile>(defaultProfile);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProfile({ ...defaultProfile, ...JSON.parse(saved) });
      } catch {}
    }
  }, []);

  const updateField = (field: keyof PatientProfile, value: string) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  const addTag = (field: keyof PatientProfile, tag: string) => {
    setProfile((p) => ({ ...p, [field]: [...(p[field] as string[]), tag] }));
  };

  const removeTag = (field: keyof PatientProfile, index: number) => {
    setProfile((p) => ({
      ...p,
      [field]: (p[field] as string[]).filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    toast.success("Profile saved successfully!");
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">Patient Profile</h1>
            <p className="text-sm text-muted-foreground">Your medical details for personalized assistance</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-primary" /> Basic Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input value={profile.name} onChange={(e) => updateField("name", e.target.value)} placeholder="John Doe" className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Age
              </label>
              <Input value={profile.age} onChange={(e) => updateField("age", e.target.value)} placeholder="25" type="number" className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Gender</label>
              <select
                value={profile.gender}
                onChange={(e) => updateField("gender", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-destructive" /> Blood Group
              </label>
              <select
                value={profile.bloodGroup}
                onChange={(e) => updateField("bloodGroup", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground"
              >
                <option value="">Select</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-primary" /> Height (cm)
              </label>
              <Input value={profile.height} onChange={(e) => updateField("height", e.target.value)} placeholder="170" type="number" className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <Weight className="w-3.5 h-3.5 text-primary" /> Weight (kg)
              </label>
              <Input value={profile.weight} onChange={(e) => updateField("weight", e.target.value)} placeholder="70" type="number" className="bg-muted/50" />
            </div>
          </div>
        </div>

        {/* Medical Details */}
        <div className="glass-card p-6 space-y-5">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" /> Medical Details
          </h2>
          <TagInput
            label="Allergies"
            icon={AlertTriangle}
            tags={profile.allergies}
            onAdd={(t) => addTag("allergies", t)}
            onRemove={(i) => removeTag("allergies", i)}
            placeholder="e.g., Penicillin, Peanuts"
          />
          <TagInput
            label="Chronic Conditions"
            icon={Heart}
            tags={profile.chronicConditions}
            onAdd={(t) => addTag("chronicConditions", t)}
            onRemove={(i) => removeTag("chronicConditions", i)}
            placeholder="e.g., Diabetes, Asthma"
          />
          <TagInput
            label="Past Surgeries"
            icon={ClipboardIcon}
            tags={profile.pastSurgeries}
            onAdd={(t) => addTag("pastSurgeries", t)}
            onRemove={(i) => removeTag("pastSurgeries", i)}
            placeholder="e.g., Appendectomy (2020)"
          />
          <TagInput
            label="Current Medications"
            icon={PillIcon}
            tags={profile.currentMedications}
            onAdd={(t) => addTag("currentMedications", t)}
            onRemove={(i) => removeTag("currentMedications", i)}
            placeholder="e.g., Metformin 500mg"
          />
        </div>

        {/* Emergency & Notes */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Emergency & Notes</h2>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Emergency Contact</label>
            <Input
              value={profile.emergencyContact}
              onChange={(e) => updateField("emergencyContact", e.target.value)}
              placeholder="Name - Phone number"
              className="bg-muted/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Additional Notes</label>
            <textarea
              value={profile.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Any other medical information..."
              className="w-full h-24 bg-muted/50 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Save */}
        <Button onClick={handleSave} className="w-full">
          <Save className="w-4 h-4 mr-1" /> Save Profile
        </Button>
      </div>
    </div>
  );
}

// Tiny inline icons to avoid extra imports
function ClipboardIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>;
}

function PillIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>;
}
