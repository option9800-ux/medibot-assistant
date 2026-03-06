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

function storageKey(mode: "medical" | "general") {
  return `medibot-${mode}-conversations`;
}

export function getConversations(mode: "medical" | "general"): Conversation[] {
  try {
    const data = localStorage.getItem(storageKey(mode));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveConversation(conv: Conversation) {
  const convs = getConversations(conv.mode);
  const idx = convs.findIndex((c) => c.id === conv.id);
  if (idx >= 0) convs[idx] = conv;
  else convs.unshift(conv);
  localStorage.setItem(storageKey(conv.mode), JSON.stringify(convs));
}

export function deleteConversation(id: string, mode: "medical" | "general") {
  const convs = getConversations(mode).filter((c) => c.id !== id);
  localStorage.setItem(storageKey(mode), JSON.stringify(convs));
}

export function clearAllConversations(mode: "medical" | "general") {
  localStorage.removeItem(storageKey(mode));
}

export function exportChatToTxt(messages: ChatMessage[]): string {
  return messages
    .map((m) => `[${m.role.toUpperCase()}]\n${m.content}`)
    .join("\n\n---\n\n");
}
