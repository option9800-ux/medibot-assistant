import { useState } from "react";
import { MapPin, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SPECIALIZATIONS = [
  "General Physician", "Cardiologist", "Dermatologist", "Orthopedic",
  "Neurologist", "Pediatrician", "Gynecologist", "ENT Specialist",
  "Ophthalmologist", "Psychiatrist", "Dentist", "Urologist",
];

export default function DoctorFinder() {
  const [specialization, setSpecialization] = useState("");
  const [location, setLocation] = useState("");

  const getSearchUrl = () => {
    const q = `${specialization || "doctor"} near ${location || "me"}`;
    return `https://www.google.com/maps/search/${encodeURIComponent(q)}`;
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">Doctor Finder</h1>
            <p className="text-sm text-muted-foreground">Find doctors and hospitals near you</p>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Specialization</label>
            <Select value={specialization} onValueChange={setSpecialization}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue placeholder="Select specialization" />
              </SelectTrigger>
              <SelectContent>
                {SPECIALIZATIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Location</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, area, or zip code..."
              className="bg-muted/50"
            />
          </div>

          <a href={getSearchUrl()} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button className="w-full">
              <Search className="w-4 h-4 mr-1" /> Search on Google Maps
            </Button>
          </a>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Quick Access</h3>
          <div className="grid grid-cols-2 gap-2">
            {["Hospital near me", "Pharmacy near me", "Emergency room near me", "Clinic near me"].map(
              (q) => (
                <button
                  key={q}
                  onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(q)}`, "_blank")}
                  className="text-xs p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 text-foreground transition-colors text-left"
                >
                  <MapPin className="w-3 h-3 inline mr-1 text-primary" />
                  {q}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
