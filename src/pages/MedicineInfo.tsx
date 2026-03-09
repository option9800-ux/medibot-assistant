import { useState } from "react";
import { Pill, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";

export default function MedicineInfo() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult("");

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/medibot-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Provide detailed information about the medicine "${query}". Include: Uses, Dosage, Side Effects, Warnings, and Drug Interactions. Format with markdown headers.`,
              },
            ],
            mode: "medical",
          }),
        }
      );

      if (!resp.ok || !resp.body) throw new Error("Failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              full += c;
              setResult(full);
            }
          } catch {}
        }
      }
    } catch (e) {
      setResult("*Error fetching medicine information. Please try again.*");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Pill className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">Medicine Information</h1>
            <p className="text-sm text-muted-foreground">Search for any medicine to get detailed info</p>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="e.g., Paracetamol, Ibuprofen, Amoxicillin..."
              className="bg-muted/50"
            />
            <Button onClick={search} disabled={loading || !query.trim()}>
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {result && (
          <div className="glass-card p-6">
            <div className="prose prose-sm prose-invert max-w-none text-foreground [&_h1]:text-primary [&_h2]:text-primary [&_h3]:text-primary [&_code]:text-primary [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          ⚕️ Always consult a pharmacist or doctor before taking any medication.
        </p>
      </div>
    </div>
  );
}
