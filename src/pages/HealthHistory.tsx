import { useState } from "react";
import { History, Download, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getConversations,
  clearAllConversations,
  deleteConversation,
  exportChatToTxt,
  type Conversation,
} from "@/lib/chatStorage";

export default function HealthHistory() {
  const [conversations, setConversations] = useState<Conversation[]>(getConversations());

  const refresh = () => setConversations(getConversations());

  const handleDelete = (id: string) => {
    deleteConversation(id);
    refresh();
  };

  const handleClearAll = () => {
    if (!confirm("Clear all conversation history?")) return;
    clearAllConversations();
    refresh();
  };

  const handleExport = (conv: Conversation) => {
    const text = exportChatToTxt(conv.messages);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${conv.title.replace(/\s+/g, "-")}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    const all = conversations
      .map((c) => `=== ${c.title} (${c.mode}) ===\n${exportChatToTxt(c.messages)}`)
      .join("\n\n" + "=".repeat(50) + "\n\n");
    const blob = new Blob([all], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mediassist-history-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Health History</h1>
              <p className="text-sm text-muted-foreground">{conversations.length} conversations</p>
            </div>
          </div>
          <div className="flex gap-2">
            {conversations.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={handleExportAll}>
                  <Download className="w-3 h-3 mr-1" /> Export All
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearAll}>
                  <Trash2 className="w-3 h-3 mr-1" /> Clear All
                </Button>
              </>
            )}
          </div>
        </div>

        {conversations.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No conversation history yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div key={conv.id} className="glass-card p-4 flex items-center gap-3 group">
                <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{conv.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {conv.mode === "medical" ? "🏥 Medical" : "💬 General"} · {conv.messages.length} messages · {new Date(conv.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleExport(conv)}>
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(conv.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
