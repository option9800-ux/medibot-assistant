import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, MessageSquare, ClipboardList, Pill, FileText, MapPin,
  ArrowRight, Heart, Droplets, Ruler, Weight, AlertTriangle,
  TrendingUp, Calendar, Sparkles, Sun, Moon, CloudSun,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const PROFILE_KEY = "mediassist-patient-profile";

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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good Morning", icon: Sun, emoji: "🌅" };
  if (h < 17) return { text: "Good Afternoon", icon: CloudSun, emoji: "☀️" };
  return { text: "Good Evening", icon: Moon, emoji: "🌙" };
}

function calcBMI(height: string, weight: string) {
  const h = parseFloat(height) / 100;
  const w = parseFloat(weight);
  if (!h || !w || h <= 0) return null;
  const bmi = w / (h * h);
  let label = "Underweight";
  let color = "text-health-blue";
  if (bmi >= 18.5 && bmi < 25) { label = "Normal"; color = "text-health-green"; }
  else if (bmi >= 25 && bmi < 30) { label = "Overweight"; color = "text-health-amber"; }
  else if (bmi >= 30) { label = "Obese"; color = "text-health-red"; }
  return { value: bmi.toFixed(1), label, color };
}

function calcProfileCompletion(p: PatientProfile) {
  const fields = [p.name, p.age, p.gender, p.bloodGroup, p.height, p.weight, p.emergencyContact];
  const arrays = [p.allergies, p.chronicConditions, p.currentMedications];
  let filled = fields.filter(Boolean).length;
  filled += arrays.filter(a => a.length > 0).length;
  return Math.round((filled / (fields.length + arrays.length)) * 100);
}

const quickActions = [
  { icon: MessageSquare, title: "AI Chat", desc: "Ask health questions", path: "/chat?mode=medical", gradient: "from-primary/20 to-primary/5" },
  { icon: ClipboardList, title: "Symptom Check", desc: "Guided analysis", path: "/symptoms", gradient: "from-health-blue/20 to-health-blue/5" },
  { icon: Pill, title: "Medicine Info", desc: "Drug details", path: "/medicine", gradient: "from-health-purple/20 to-health-purple/5" },
  { icon: FileText, title: "Reports", desc: "Analyze reports", path: "/reports", gradient: "from-health-amber/20 to-health-amber/5" },
  { icon: MapPin, title: "Find Doctors", desc: "Nearby healthcare", path: "/doctors", gradient: "from-health-green/20 to-health-green/5" },
];

const healthTips = [
  { icon: "💧", tip: "Stay hydrated — aim for 8 glasses of water daily" },
  { icon: "🏃", tip: "30 minutes of moderate exercise can boost your mood" },
  { icon: "😴", tip: "Quality sleep (7-9 hrs) is essential for recovery" },
  { icon: "🥗", tip: "Include fruits and vegetables in every meal" },
  { icon: "🧘", tip: "Practice mindfulness to reduce stress levels" },
];

const Index = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const greeting = useMemo(getGreeting, []);
  const [tipIndex] = useState(() => Math.floor(Math.random() * healthTips.length));

  useEffect(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      try { setProfile(JSON.parse(saved)); } catch {}
    }
  }, []);

  const bmi = profile ? calcBMI(profile.height, profile.weight) : null;
  const completion = profile ? calcProfileCompletion(profile) : 0;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Greeting Section */}
        <div className="dashboard-greeting p-5 sm:p-6 animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> {today}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {greeting.emoji} {greeting.text}{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}!
              </h1>
              <p className="text-sm text-muted-foreground max-w-md">
                Your AI health companion is ready to help. How are you feeling today?
              </p>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center">
              <Activity className="w-6 h-6 text-primary animate-float" />
            </div>
          </div>
        </div>

        {/* Health Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* BMI Card */}
          <div className="stat-card p-4 space-y-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">BMI</span>
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            {bmi ? (
              <>
                <p className={`text-2xl font-bold ${bmi.color}`}>{bmi.value}</p>
                <p className={`text-xs font-medium ${bmi.color}`}>{bmi.label}</p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-muted-foreground">—</p>
                <button onClick={() => navigate("/profile")} className="text-xs text-primary hover:underline">Add height & weight</button>
              </>
            )}
          </div>

          {/* Blood Group */}
          <div className="stat-card p-4 space-y-2 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Blood Group</span>
              <Droplets className="w-3.5 h-3.5 text-health-red" />
            </div>
            {profile?.bloodGroup ? (
              <p className="text-2xl font-bold text-health-red">{profile.bloodGroup}</p>
            ) : (
              <>
                <p className="text-lg font-semibold text-muted-foreground">—</p>
                <button onClick={() => navigate("/profile")} className="text-xs text-primary hover:underline">Set blood group</button>
              </>
            )}
          </div>

          {/* Allergies Count */}
          <div className="stat-card p-4 space-y-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Allergies</span>
              <AlertTriangle className="w-3.5 h-3.5 text-health-amber" />
            </div>
            {profile?.allergies?.length ? (
              <>
                <p className="text-2xl font-bold text-health-amber">{profile.allergies.length}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.allergies.slice(0, 2).join(", ")}</p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-health-green">None</p>
                <p className="text-xs text-muted-foreground">No allergies listed</p>
              </>
            )}
          </div>

          {/* Medications */}
          <div className="stat-card p-4 space-y-2 animate-fade-in" style={{ animationDelay: "0.25s" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Medications</span>
              <Pill className="w-3.5 h-3.5 text-health-purple" />
            </div>
            {profile?.currentMedications?.length ? (
              <>
                <p className="text-2xl font-bold text-health-purple">{profile.currentMedications.length}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.currentMedications[0]}</p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-health-green">None</p>
                <p className="text-xs text-muted-foreground">No medications</p>
              </>
            )}
          </div>
        </div>

        {/* Profile Completion + Health Tip */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Profile Completion */}
          <div className="glass-card p-5 space-y-3 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" /> Profile Completion
              </h3>
              <span className="text-sm font-bold text-primary">{completion}%</span>
            </div>
            <Progress value={completion} className="h-2" />
            {completion < 100 && (
              <button
                onClick={() => navigate("/profile")}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Complete your profile for personalized insights <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Daily Health Tip */}
          <div className="glass-card p-5 space-y-2 animate-fade-in" style={{ animationDelay: "0.35s" }}>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-health-amber" /> Daily Health Tip
            </h3>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{healthTips[tipIndex].icon}</span>
              <p className="text-sm text-muted-foreground leading-relaxed">{healthTips[tipIndex].tip}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <h2 className="text-sm font-semibold text-foreground px-1">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => navigate(action.path)}
                className="stat-card p-4 flex flex-col items-start gap-3 text-left group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{action.title}</h3>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="glass-card p-4 text-center animate-fade-in" style={{ animationDelay: "0.45s" }}>
          <p className="text-xs text-muted-foreground">
            ⚕️ <strong>Medical Disclaimer:</strong> This AI assistant provides general health information
            and should not replace professional medical advice, diagnosis, or treatment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
