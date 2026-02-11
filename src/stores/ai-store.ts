import { create } from "zustand";

export type AIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  context?: {
    entityType?: string;
    entityId?: string;
    viewContext?: string;
  };
};

type AIState = {
  messages: AIMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  activeContext: {
    entityType?: string;
    entityId?: string;
    viewContext?: string;
  } | null;
};

type AIActions = {
  addMessage: (message: AIMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setActiveContext: (context: AIState["activeContext"]) => void;
  clearMessages: () => void;
};

export const useAIStore = create<AIState & AIActions>((set) => ({
  messages: [],
  isLoading: false,
  isStreaming: false,
  activeContext: null,

  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),

  updateLastAssistantMessage: (content) =>
    set((s) => {
      const msgs = [...s.messages];
      const lastIdx = msgs.findLastIndex((m) => m.role === "assistant");
      if (lastIdx >= 0) {
        msgs[lastIdx] = { ...msgs[lastIdx], content };
      }
      return { messages: msgs };
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  setActiveContext: (activeContext) => set({ activeContext }),
  clearMessages: () => set({ messages: [] }),
}));
