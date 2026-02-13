import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIMessage } from "./ai-store";

/* ─── Types ─── */

export type FocusQueueItem = {
  taskId: string;
  addedAt: string; // ISO timestamp
  completedInSession?: boolean; // marked done during this focus session
};

type FocusState = {
  /* Queue */
  queue: FocusQueueItem[];
  currentIndex: number;

  /* Mode */
  isActive: boolean; // focus mode overlay visible
  isSelecting: boolean; // checkbox mode on tasks list
  selectedTaskIds: string[]; // during selection

  /* Per-task AI chat (keyed by taskId) */
  chatMessages: Record<string, AIMessage[]>;
  isChatLoading: boolean;
  isChatStreaming: boolean;

  /* Timer */
  focusStartedAt: string | null; // ISO timestamp when current task focus began
};

type FocusActions = {
  /* Selection */
  toggleSelecting: () => void;
  toggleTaskSelection: (taskId: string) => void;
  selectAll: (taskIds: string[]) => void;
  clearSelection: () => void;

  /* Queue management */
  addToQueue: (taskIds: string[]) => void;
  removeFromQueue: (taskId: string) => void;
  clearQueue: () => void;

  /* Focus mode */
  startFocus: () => void;
  exitFocus: () => void;
  goToNext: () => void;
  goToPrevious: () => void;
  goToIndex: (index: number) => void;
  markCurrentCompleted: () => void;

  /* Per-task chat */
  addChatMessage: (taskId: string, message: AIMessage) => void;
  updateLastChatMessage: (taskId: string, content: string) => void;
  clearChatForTask: (taskId: string) => void;
  setChatLoading: (loading: boolean) => void;
  setChatStreaming: (streaming: boolean) => void;
};

/* ─── Store ─── */

export const useFocusStore = create<FocusState & FocusActions>()(
  persist(
    (set, get) => ({
      /* ── Initial state ── */
      queue: [],
      currentIndex: 0,
      isActive: false,
      isSelecting: false,
      selectedTaskIds: [],
      chatMessages: {},
      isChatLoading: false,
      isChatStreaming: false,
      focusStartedAt: null,

      /* ── Selection ── */

      toggleSelecting: () =>
        set((s) => ({
          isSelecting: !s.isSelecting,
          selectedTaskIds: !s.isSelecting ? s.selectedTaskIds : [],
        })),

      toggleTaskSelection: (taskId) =>
        set((s) => {
          const idx = s.selectedTaskIds.indexOf(taskId);
          if (idx >= 0) {
            return { selectedTaskIds: s.selectedTaskIds.filter((id) => id !== taskId) };
          }
          return { selectedTaskIds: [...s.selectedTaskIds, taskId] };
        }),

      selectAll: (taskIds) => set({ selectedTaskIds: taskIds }),

      clearSelection: () => set({ selectedTaskIds: [], isSelecting: false }),

      /* ── Queue management ── */

      addToQueue: (taskIds) =>
        set((s) => {
          const existingIds = new Set(s.queue.map((q) => q.taskId));
          const newItems: FocusQueueItem[] = taskIds
            .filter((id) => !existingIds.has(id))
            .map((id) => ({ taskId: id, addedAt: new Date().toISOString() }));
          return {
            queue: [...s.queue, ...newItems],
            selectedTaskIds: [],
            isSelecting: false,
          };
        }),

      removeFromQueue: (taskId) =>
        set((s) => {
          const newQueue = s.queue.filter((q) => q.taskId !== taskId);
          const newIndex = Math.min(s.currentIndex, Math.max(0, newQueue.length - 1));
          return { queue: newQueue, currentIndex: newIndex };
        }),

      clearQueue: () =>
        set({
          queue: [],
          currentIndex: 0,
          chatMessages: {},
          focusStartedAt: null,
        }),

      /* ── Focus mode ── */

      startFocus: () => {
        const { queue } = get();
        if (queue.length === 0) return;
        set({
          isActive: true,
          currentIndex: 0,
          focusStartedAt: new Date().toISOString(),
          isSelecting: false,
          selectedTaskIds: [],
        });
      },

      exitFocus: () =>
        set({
          isActive: false,
          focusStartedAt: null,
          isChatLoading: false,
          isChatStreaming: false,
        }),

      goToNext: () =>
        set((s) => {
          const nextIndex = s.currentIndex + 1;
          if (nextIndex >= s.queue.length) return s; // already at last
          return {
            currentIndex: nextIndex,
            focusStartedAt: new Date().toISOString(),
            isChatLoading: false,
            isChatStreaming: false,
          };
        }),

      goToPrevious: () =>
        set((s) => {
          const prevIndex = s.currentIndex - 1;
          if (prevIndex < 0) return s; // already at first
          return {
            currentIndex: prevIndex,
            focusStartedAt: new Date().toISOString(),
            isChatLoading: false,
            isChatStreaming: false,
          };
        }),

      goToIndex: (index) =>
        set((s) => {
          if (index < 0 || index >= s.queue.length) return s;
          return {
            currentIndex: index,
            focusStartedAt: new Date().toISOString(),
            isChatLoading: false,
            isChatStreaming: false,
          };
        }),

      markCurrentCompleted: () =>
        set((s) => {
          const newQueue = [...s.queue];
          if (newQueue[s.currentIndex]) {
            newQueue[s.currentIndex] = {
              ...newQueue[s.currentIndex],
              completedInSession: true,
            };
          }
          return { queue: newQueue };
        }),

      /* ── Per-task chat ── */

      addChatMessage: (taskId, message) =>
        set((s) => ({
          chatMessages: {
            ...s.chatMessages,
            [taskId]: [...(s.chatMessages[taskId] || []), message],
          },
        })),

      updateLastChatMessage: (taskId, content) =>
        set((s) => {
          const msgs = [...(s.chatMessages[taskId] || [])];
          const lastIdx = msgs.findLastIndex((m) => m.role === "assistant");
          if (lastIdx >= 0) {
            msgs[lastIdx] = { ...msgs[lastIdx], content };
          }
          return {
            chatMessages: { ...s.chatMessages, [taskId]: msgs },
          };
        }),

      clearChatForTask: (taskId) =>
        set((s) => {
          const { [taskId]: _, ...rest } = s.chatMessages;
          return { chatMessages: rest };
        }),

      setChatLoading: (isChatLoading) => set({ isChatLoading }),
      setChatStreaming: (isChatStreaming) => set({ isChatStreaming }),
    }),
    {
      name: "nexus-focus-queue",
      partialize: (state) => ({
        // Only persist queue and chat messages, not transient UI state
        queue: state.queue,
        currentIndex: state.currentIndex,
        chatMessages: state.chatMessages,
      }),
    }
  )
);
