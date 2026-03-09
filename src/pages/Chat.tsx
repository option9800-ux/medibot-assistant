import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, Activity, Trash2 } from "lucide-react";
import { ChatMessageBubble } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { EmergencyAlert, detectEmergency } from "@/components/EmergencyAlert";
import {
  type ChatMessage,
  type Conversation,
  getConversations,
  saveConversation,
  exportChatToTxt,
} from "@/lib/chatStorage";
import { Button } from "@/components/ui/button";

export default function Chat() {
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get("mode") as "medical" | "general") || "medical";

  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const startNewChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setShowEmergency(false);
  }, []);

  const handleDownload = () => {
    const text = exportChatToTxt(messages);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mediassist-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSend = async (text: string, file?: { mimeType: string; base64: string; fileName: string } | null) => {
    // Emergency detection
    if (mode === "medical" && detectEmergency(text)) {
      setShowEmergency(true);
    }

    const userMsg: ChatMessage = { role: "user", content: text, fileData: file };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsStreaming(true);

    const convId = activeId || crypto.randomUUID();
    if (!activeId) setActiveId(convId);

    let assistantContent = "";

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      const apiMessages = newMessages.map((m) => {
        if (m.fileData) {
          return {
            role: m.role,
            content: m.content,
            fileData: { mimeType: m.fileData.mimeType, base64: m.fileData.base64 },
          };
        }
        return { role: m.role, content: m.content };
      });

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/medibot-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages, mode }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      updateAssistant(`\n\n*Error: ${e.message}*`);
    }

    setIsStreaming(false);

    setMessages((final) => {
      const conv: Conversation = {
        id: convId,
        mode,
        title: text.slice(0, 40) || "New chat",
        messages: final,
        createdAt: Date.now(),
      };
      saveConversation(conv);
      return final;
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Sub-header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border">
        <Activity className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">
          {mode === "medical" ? "Medical" : "General"} Mode
        </span>
        <div className="flex-1" />
        {messages.length > 0 && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload} title="Download">
              <Download className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startNewChat} title="New chat">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Emergency Alert */}
      {showEmergency && <EmergencyAlert />}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
            <Activity className="w-12 h-12 text-primary animate-float" />
            <p className="text-muted-foreground">Start a conversation with MediAssist AI</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Ask health questions, describe symptoms, or upload medical reports for analysis.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <ChatMessageBubble
            key={i}
            role={m.role}
            content={m.content}
            isStreaming={isStreaming && i === messages.length - 1 && m.role === "assistant"}
          />
        ))}
      </div>

      {/* Disclaimer */}
      {messages.length === 0 && (
        <div className="px-4 pb-2">
          <p className="text-[10px] text-muted-foreground text-center">
            ⚕️ This AI provides general health info and is not a substitute for professional medical advice.
          </p>
        </div>
      )}

      {/* Input */}
      <div className="p-4 pt-0">
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
