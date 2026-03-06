import { Bot, User, Volume2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

function speakText(text: string) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }
}

export function ChatMessageBubble({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-primary/20" : "bg-secondary/20"
        }`}
      >
        {isUser ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-secondary" />}
      </div>
      <div
        className={`glass-card px-4 py-3 max-w-[75%] relative group ${
          isUser ? "bg-primary/10" : ""
        }`}
      >
        <div className="prose prose-sm prose-invert max-w-none text-foreground [&_p]:mb-2 [&_p:last-child]:mb-0 [&_code]:text-primary [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-md [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        {!isUser && !isStreaming && content && (
          <button
            onClick={() => speakText(content)}
            className="absolute -bottom-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-muted hover:bg-muted/80"
            title="Read aloud"
          >
            <Volume2 className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-primary/70 animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  );
}
