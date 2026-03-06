import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Download, ArrowLeft, Activity } from "lucide-react";
import { ChatMessageBubble } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ChatSidebar } from "@/components/ChatSidebar";
import {
  type ChatMessage,
  type Conversation,
  getConversations,
  saveConversation,
  deleteConversation,
  clearAllConversations,
  exportChatToTxt,
} from "@/lib/chatStorage";

interface ChatProps {
  mode: "medical" | "general";
}

export default function Chat({ mode }: ChatProps) {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>(getConversations(mode));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeId);

  // Refresh conversations when mode changes
  useEffect(() => {
    setConversations(getConversations(mode));
    setActiveId(null);
    setMessages([]);
  }, [mode]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const refreshConversations = () => setConversations(getConversations(mode));

  const startNewChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
  }, []);

  const selectConversation = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setActiveId(id);
      setMessages(conv.messages);
      setSidebarOpen(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteConversation(id, mode);
    if (activeId === id) startNewChat();
    refreshConversations();
  };

  const handleClearAll = () => {
    clearAllConversations(mode);
    startNewChat();
    refreshConversations();
  };

  const handleDownload = () => {
    const text = exportChatToTxt(messages);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medibot-${mode}-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSend = async (text: string, file?: { mimeType: string; base64: string; fileName: string } | null) => {
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
        createdAt: activeConv?.createdAt || Date.now(),
      };
      saveConversation(conv);
      refreshConversations();
      return final;
    });
  };

  return (
    <div className="h-screen flex overflow-hidden">
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={startNewChat}
        onDelete={handleDelete}
        onClearAll={handleClearAll}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="glass flex items-center gap-3 px-4 py-3 border-b border-border">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 rounded-md hover:bg-muted">
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
          <button onClick={() => navigate("/")} className="p-1.5 rounded-md hover:bg-muted">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <Activity className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-primary text-sm">
            MediBot — {mode === "medical" ? "Medical" : "General"} Mode
          </h1>
          <div className="flex-1" />
          {messages.length > 0 && (
            <button onClick={handleDownload} className="p-1.5 rounded-md hover:bg-muted" title="Download chat">
              <Download className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
              <Activity className="w-12 h-12 text-primary animate-float" />
              <p className="text-muted-foreground">
                {mode === "medical" ? "Ask a health or medical question" : "Ask anything — coding, science, history..."}
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

        <div className="p-4 pt-0">
          <ChatInput onSend={handleSend} disabled={isStreaming} />
        </div>
      </div>
    </div>
  );
}
