import { Stethoscope, Bot } from "lucide-react";

interface ModeCardProps {
  mode: "medical" | "general";
  onClick: () => void;
}

const config = {
  medical: {
    icon: Stethoscope,
    title: "Medical Bot",
    description: "Evidence-based health information with professional disclaimers",
  },
  general: {
    icon: Bot,
    title: "General Bot",
    description: "Coding help, general knowledge, and creative assistance",
  },
};

export function ModeCard({ mode, onClick }: ModeCardProps) {
  const { icon: Icon, title, description } = config[mode];

  return (
    <button
      onClick={onClick}
      className="glass-card glow-border p-8 w-72 flex flex-col items-center gap-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:border-primary/40 group"
    >
      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      <p className="text-sm text-muted-foreground text-center">{description}</p>
    </button>
  );
}
