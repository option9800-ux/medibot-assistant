export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  fileData?: { mimeType: string; base64: string; fileName: string } | null;
}

export interface Conversation {
  id: string;
  mode: "medical" | "general";
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

const STORAGE_KEY = "medibot-conversations";

export function getConversations(): Conversation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveConversation(conv: Conversation) {
  const convs = getConversations();
  const idx = convs.findIndex((c) => c.id === conv.id);
  if (idx >= 0) convs[idx] = conv;
  else convs.unshift(conv);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
}

export function deleteConversation(id: string) {
  const convs = getConversations().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
}

export function clearAllConversations() {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportChatToTxt(messages: ChatMessage[]): string {
  return messages
    .map((m) => `[${m.role.toUpperCase()}]\n${m.content}`)
    .join("\n\n---\n\n");
}
