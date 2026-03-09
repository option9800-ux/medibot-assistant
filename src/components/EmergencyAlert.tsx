import { AlertTriangle, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const EMERGENCY_KEYWORDS = [
  "chest pain", "heart attack", "stroke", "difficulty breathing", "can't breathe",
  "severe bleeding", "unconscious", "seizure", "choking", "anaphylaxis",
  "suicide", "overdose", "poisoning", "head injury", "severe burn",
];

export function detectEmergency(text: string): boolean {
  const lower = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw));
}

export function EmergencyAlert() {
  return (
    <div className="mx-4 mb-4 p-4 rounded-lg border-2 border-destructive bg-destructive/10 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div className="space-y-2 flex-1">
          <h3 className="font-bold text-destructive">⚠️ Possible Emergency Detected</h3>
          <p className="text-sm text-foreground">
            Based on your message, this could be a medical emergency. Please contact medical help immediately.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => window.open("tel:911")}
            >
              <Phone className="w-4 h-4 mr-1" /> Call Emergency (911)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open("https://www.google.com/maps/search/hospital+near+me", "_blank")
              }
            >
              <MapPin className="w-4 h-4 mr-1" /> Find Nearby Hospital
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
