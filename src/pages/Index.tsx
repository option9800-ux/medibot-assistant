import { useNavigate } from "react-router-dom";
import { ModeCard } from "@/components/ModeCard";
import { Activity } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-12 p-6">
      {/* Ambient glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="text-center space-y-3 animate-fade-in relative z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="w-8 h-8 text-primary glow-text" />
          <h1 className="text-4xl md:text-5xl font-bold text-primary glow-text">
            MediBot
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">Choose your assistant mode to get started</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 animate-fade-in relative z-10" style={{ animationDelay: "0.2s" }}>
        <ModeCard mode="medical" onClick={() => navigate("/chat?mode=medical")} />
        <ModeCard mode="general" onClick={() => navigate("/chat?mode=general")} />
      </div>
    </div>
  );
};

export default Index;
