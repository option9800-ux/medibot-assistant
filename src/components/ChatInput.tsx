import { useState, useRef } from "react";
import { Send, Mic, MicOff, Paperclip, X } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string, file?: { mimeType: string; base64: string; fileName: string } | null) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [file, setFile] = useState<{ mimeType: string; base64: string; fileName: string } | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const text = input.trim();
    if (!text && !file) return;
    onSend(text || (file ? `[Uploaded: ${file.fileName}]` : ""), file);
    setInput("");
    setFile(null);
  };

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput((prev) => prev + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      setFile({ mimeType: f.type, base64, fileName: f.name });
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  return (
    <div className="glass-card p-3">
      {file && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-muted rounded-md text-sm">
          <Paperclip className="w-3 h-3 text-primary" />
          <span className="text-foreground truncate flex-1">{file.fileName}</span>
          <button onClick={() => setFile(null)}>
            <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <button
          onClick={toggleVoice}
          className={`p-2 rounded-lg transition-colors ${
            isListening ? "bg-primary/20 text-primary glow-subtle" : "hover:bg-muted text-muted-foreground hover:text-primary"
          }`}
          title="Voice input"
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type your message..."
          disabled={disabled}
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm"
        />
        <button
          onClick={handleSend}
          disabled={disabled || (!input.trim() && !file)}
          className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed glow-subtle"
          title="Send"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
