import { Trash2, Plus, MessageSquare, X } from "lucide-react";
import type { Conversation } from "@/lib/chatStorage";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  open: boolean;
  onClose: () => void;
}

export function ChatSidebar({ conversations, activeId, onSelect, onNew, onDelete, onClearAll, open, onClose }: ChatSidebarProps) {
  return (
    <>
      {/* Overlay for mobile */}
      {open && <div className="fixed inset-0 bg-background/60 z-40 md:hidden" onClick={onClose} />}

      <aside
        className={`fixed md:relative z-50 top-0 left-0 h-full w-72 glass flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-primary text-sm">Chat History</h2>
          <div className="flex gap-1">
            <button onClick={onNew} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="New chat">
              <Plus className="w-4 h-4 text-primary" />
            </button>
            <button onClick={onClearAll} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="Clear all">
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors md:hidden">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No conversations yet</p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer group transition-colors text-sm ${
                c.id === activeId ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="truncate flex-1">{c.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded"
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
