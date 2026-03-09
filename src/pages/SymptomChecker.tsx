import { useState } from "react";
import { ClipboardList, ArrowRight, RotateCcw, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface SymptomResult {
  condition: string;
  riskLevel: "Low" | "Medium" | "High";
  suggestedCare: string;
}

interface AnalysisResult {
  results: SymptomResult[];
  recommendation: string;
}

export default function SymptomChecker() {
  const [step, setStep] = useState<"input" | "followup" | "result">("input");
  const [symptoms, setSymptoms] = useState("");
  const [followUpQ, setFollowUpQ] = useState("");
  const [followUpA, setFollowUpA] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const analyzeSymptoms = async (extraContext?: string) => {
    setLoading(true);
    try {
      const prompt = `Analyze these symptoms and return a JSON object with this exact structure:
{
  "followUpQuestion": "a follow-up question to ask (or null if enough info)",
  "results": [
    { "condition": "name", "riskLevel": "Low|Medium|High", "suggestedCare": "brief advice" }
  ],
  "recommendation": "overall recommendation"
}

Symptoms: ${symptoms}
${extraContext ? `Additional info: ${extraContext}` : ""}

Return ONLY valid JSON, no markdown.`;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/medibot-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
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
            if (c) full += c;
          } catch {}
        }
      }

      // Extract JSON from response
      const jsonMatch = full.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        if (data.followUpQuestion && step === "input") {
          setFollowUpQ(data.followUpQuestion);
          setStep("followup");
        } else {
          setAnalysis({ results: data.results || [], recommendation: data.recommendation || "" });
          setStep("result");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const riskColor = (level: string) => {
    if (level === "High") return "destructive";
    if (level === "Medium") return "secondary";
    return "outline";
  };

  const riskIcon = (level: string) => {
    if (level === "High") return <AlertTriangle className="w-4 h-4" />;
    if (level === "Medium") return <Info className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const reset = () => {
    setStep("input");
    setSymptoms("");
    setFollowUpQ("");
    setFollowUpA("");
    setAnalysis(null);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">Symptom Checker</h1>
            <p className="text-sm text-muted-foreground">Describe your symptoms for AI analysis</p>
          </div>
        </div>

        {step === "input" && (
          <div className="glass-card p-6 space-y-4">
            <label className="text-sm font-medium text-foreground">
              What symptoms are you experiencing?
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g., headache for 2 days, mild fever, sore throat..."
              className="w-full h-32 bg-muted/50 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button onClick={() => analyzeSymptoms()} disabled={!symptoms.trim() || loading} className="w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : (
                <>
                  Analyze Symptoms <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        )}

        {step === "followup" && (
          <div className="glass-card p-6 space-y-4">
            <p className="text-sm font-medium text-foreground">{followUpQ}</p>
            <Input
              value={followUpA}
              onChange={(e) => setFollowUpA(e.target.value)}
              placeholder="Your answer..."
              className="bg-muted/50"
            />
            <Button
              onClick={() => analyzeSymptoms(followUpA)}
              disabled={!followUpA.trim() || loading}
              className="w-full"
            >
              {loading ? "Analyzing..." : "Continue"}
            </Button>
          </div>
        )}

        {step === "result" && analysis && (
          <div className="space-y-4">
            <div className="glass-card p-6 space-y-4">
              <h2 className="font-semibold text-foreground">Possible Conditions</h2>
              <div className="space-y-3">
                {analysis.results.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                    {riskIcon(r.riskLevel)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground text-sm">{r.condition}</span>
                        <Badge variant={riskColor(r.riskLevel) as any}>{r.riskLevel} Risk</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{r.suggestedCare}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-4">
              <p className="text-sm text-foreground">{analysis.recommendation}</p>
            </div>

            <Button variant="outline" onClick={reset} className="w-full">
              <RotateCcw className="w-4 h-4 mr-1" /> Check New Symptoms
            </Button>

            <p className="text-[10px] text-muted-foreground text-center">
              ⚕️ This is AI-generated analysis. Always consult a healthcare professional for diagnosis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
