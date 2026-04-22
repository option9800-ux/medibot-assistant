import { useState, useRef } from "react";
import { FileText, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

export default function Reports() {
  const [file, setFile] = useState<{ name: string; base64: string; mimeType: string } | null>(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      setFile({ name: f.name, base64: r.split(",")[1], mimeType: f.type });
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  const analyze = async () => {
    if (!file) return;
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
                content: `Analyze this medical report and explain it in VERY SIMPLE everyday language that a common person with NO medical background can easily understand. Follow these rules strictly:

1. **Avoid medical jargon.** If you must use a medical term, immediately explain it in brackets like a friend would (e.g., "Hemoglobin (the protein in blood that carries oxygen)").
2. **Use simple analogies** and real-life comparisons wherever possible (e.g., "Think of cholesterol like grease building up in a pipe").
3. **Structure with markdown:**
   - Start with a short "📋 Summary in Plain Words" section (2-3 sentences overall health snapshot).
   - Then "🔍 What Each Test Means" — list each value with: what it measures, your result, normal range, and a simple "what this means for you" line.
   - Mark abnormal values clearly with ⚠️ and explain in plain words why it matters.
   - Mark normal values with ✅.
   - End with "💡 What You Should Do Next" — simple, actionable suggestions (lifestyle tips, when to see a doctor, etc.).
4. **Be warm and reassuring**, not scary. Avoid alarming language unless something is genuinely urgent.
5. Keep sentences SHORT. Use bullet points generously.
6. Always end with a gentle reminder to consult a real doctor for proper diagnosis.`,
                fileData: { mimeType: file.mimeType, base64: file.base64 },
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
    } catch {
      setResult("*Error analyzing report. Please try again.*");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">Health Report Analyzer</h1>
            <p className="text-sm text-muted-foreground">Upload a medical report for AI analysis</p>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <input type="file" ref={fileRef} className="hidden" accept="image/*,.pdf" onChange={handleFile} />
          {!file ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center gap-3 hover:border-primary/40 transition-colors"
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload PDF or image</span>
            </button>
          ) : (
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-foreground truncate">{file.name}</span>
              <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                Remove
              </Button>
            </div>
          )}

          {file && (
            <Button onClick={analyze} disabled={loading} className="w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                </span>
              ) : (
                "Analyze Report"
              )}
            </Button>
          )}
        </div>

        {result && (
          <div className="glass-card p-6">
            <div className="prose prose-sm prose-invert max-w-none text-foreground [&_h1]:text-primary [&_h2]:text-primary [&_h3]:text-primary">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
