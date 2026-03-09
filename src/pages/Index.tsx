import { useNavigate } from "react-router-dom";
import { Activity, MessageSquare, ClipboardList, Pill, FileText, MapPin, ArrowRight } from "lucide-react";

const features = [
  { icon: MessageSquare, title: "AI Chat", desc: "Ask health questions", path: "/chat?mode=medical", color: "text-primary" },
  { icon: ClipboardList, title: "Symptom Checker", desc: "Guided symptom analysis", path: "/symptoms", color: "text-primary" },
  { icon: Pill, title: "Medicine Info", desc: "Drug details & side effects", path: "/medicine", color: "text-primary" },
  { icon: FileText, title: "Report Analyzer", desc: "Upload & analyze reports", path: "/reports", color: "text-primary" },
  { icon: MapPin, title: "Doctor Finder", desc: "Find nearby healthcare", path: "/doctors", color: "text-primary" },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
        {/* Hero */}
        <div className="text-center space-y-3 py-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="w-10 h-10 text-primary glow-text" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary glow-text">
            Welcome to MediAssist AI
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your AI-powered healthcare assistant. Get medical insights, check symptoms, and find care — all in one place.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <button
              key={f.title}
              onClick={() => navigate(f.path)}
              className="glass-card glow-border p-6 flex flex-col items-start gap-3 text-left transition-all hover:scale-[1.02] hover:border-primary/30 group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-auto" />
            </button>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground">
            ⚕️ <strong>Medical Disclaimer:</strong> This AI assistant provides general health information
            and should not replace professional medical advice, diagnosis, or treatment.
            Always consult a qualified healthcare provider.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
