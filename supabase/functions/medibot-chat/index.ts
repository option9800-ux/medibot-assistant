import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  medical:
    "You are MediBot, a strictly medical and health-only assistant. You ONLY answer questions related to: medicine, medications, symptoms, diseases, conditions, anatomy, physiology, nutrition, fitness, mental health, first aid, medical procedures, lab tests, prescriptions, healthcare, and wellness. \n\nSTRICT RULES:\n1. If the user asks about ANYTHING non-medical (coding, math, history, geography, sports, entertainment, politics, general knowledge, jokes, personal opinions, weather, technology, recipes unrelated to medical diets, etc.), you MUST politely refuse with: \"I'm a medical assistant and can only help with health-related questions. Please ask me about symptoms, medications, conditions, or any other medical topic.\" Do NOT answer the off-topic question even partially.\n2. For all medical answers: provide evidence-based information, be thorough, clear, and empathetic.\n3. Always include a brief disclaimer that you are an AI and not a substitute for professional medical advice, and recommend consulting a healthcare professional when appropriate.\n4. Medical-related image/file uploads (prescriptions, reports, skin conditions, X-rays, etc.) are allowed and should be analyzed. Refuse non-medical images.",
  general:
    "You are a helpful general assistant knowledgeable about coding, science, history, mathematics, and general knowledge. Be concise, accurate, and helpful. Use markdown formatting for code blocks and structured responses.",
  symptom_check:
    "You are a medical symptom analysis assistant. Analyze the user's symptoms carefully and provide possible conditions with risk levels and care suggestions. Be thorough but concise.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode, useTools } = await req.json();
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

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: systemPrompt }, ...apiMessages],
      stream: !useTools,
    };

    // Add tool calling for structured output (symptom checker)
    if (useTools) {
      body.tools = [
        {
          type: "function",
          function: {
            name: "symptom_analysis",
            description: "Analyze symptoms and return structured results with possible conditions, risk levels, and care suggestions. Optionally include a follow-up question if more info is needed.",
            parameters: {
              type: "object",
              properties: {
                followUpQuestion: {
                  type: "string",
                  description: "A follow-up question to ask if more information is needed. Null or empty if enough info is available.",
                },
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      condition: { type: "string", description: "Name of the possible condition" },
                      riskLevel: { type: "string", enum: ["Low", "Medium", "High"], description: "Severity level" },
                      suggestedCare: { type: "string", description: "Brief care advice" },
                    },
                    required: ["condition", "riskLevel", "suggestedCare"],
                    additionalProperties: false,
                  },
                },
                recommendation: {
                  type: "string",
                  description: "Overall recommendation for the patient",
                },
              },
              required: ["results", "recommendation"],
              additionalProperties: false,
            },
          },
        },
      ];
      body.tool_choice = { type: "function", function: { name: "symptom_analysis" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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

    if (useTools) {
      // Non-streaming: return parsed tool call result
      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const args = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify(args), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "No tool call in response" }), {
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