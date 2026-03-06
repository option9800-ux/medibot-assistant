import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  medical:
    "You are a strict Medical AI named MediBot. You ONLY answer health, wellness, and medical questions. If a user asks about anything else (coding, history, jokes, general tasks, or any non-medical topic), you must respond: 'I am specialized in medical assistance only. Please switch to the General Bot for other queries.' This rule also applies to uploaded images or files — if they are not medical in nature (e.g. a coding screenshot), refuse to analyze them and redirect to the General Bot. Include this medical disclaimer in EVERY response: '⚠️ Disclaimer: I am an AI assistant and not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional.' Be thorough, clear, and empathetic when answering medical questions.",
  general:
    "You are a General Purpose AI assistant. You handle coding, creative writing, science, history, mathematics, and general knowledge. If a user asks for medical advice, symptoms, diagnoses, health tips, or any health-related questions, you must respond: 'I am not programmed for medical advice. Please switch to MediBot for health-related inquiries.' This rule also applies to uploaded images or files — if they appear medical in nature (e.g. X-rays, lab results, symptoms), refuse to analyze them and redirect to MediBot. Do not provide any medical information. Be concise, accurate, and helpful. Use markdown formatting for code blocks and structured responses.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.general;

    // Convert messages: handle file data by appending description
    const apiMessages = messages.map((m: any) => {
      if (m.fileData) {
        return {
          role: m.role,
          content: [
            { type: "text", text: m.content || "Please analyze this file." },
            {
              type: "image_url",
              image_url: {
                url: `data:${m.fileData.mimeType};base64,${m.fileData.base64}`,
              },
            },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...apiMessages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("medibot-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
