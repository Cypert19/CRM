"use client";

import { useRef, useEffect, useCallback } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { AIInput } from "@/components/ai/ai-input";
import { AIMessageBubble } from "@/components/ai/ai-message";
import { ThinkingGradient } from "@/components/ai/thinking-gradient";
import { useFocusStore } from "@/stores/focus-store";
import type { AIMessage } from "@/stores/ai-store";

const SUGGESTED_PROMPTS = [
  "Give me step-by-step instructions for this task",
  "What context do I need from past meetings?",
  "Help me draft a message for this",
  "What should I prepare before starting?",
  "Summarize everything I know about this deal",
];

export function FocusAIChat({
  taskId,
  taskTitle,
}: {
  taskId: string;
  taskTitle: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    chatMessages,
    isChatLoading,
    isChatStreaming,
    addChatMessage,
    updateLastChatMessage,
    clearChatForTask,
    setChatLoading,
    setChatStreaming,
  } = useFocusStore();

  const messages = chatMessages[taskId] || [];

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      // Add user message
      const userMessage: AIMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        createdAt: new Date(),
      };
      addChatMessage(taskId, userMessage);

      // Add empty assistant placeholder
      const assistantMessage: AIMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: "",
        createdAt: new Date(),
      };
      addChatMessage(taskId, assistantMessage);

      setChatLoading(true);
      setChatStreaming(true);

      try {
        // Build messages array for API (all messages for this task)
        const currentMessages = [
          ...messages,
          userMessage,
        ].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: currentMessages,
            focusTaskId: taskId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get AI response");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          updateLastChatMessage(taskId, accumulated);
        }

        setChatLoading(false);
        setChatStreaming(false);
      } catch (error) {
        console.error("Focus AI chat error:", error);
        updateLastChatMessage(
          taskId,
          "Sorry, I encountered an error. Please try again."
        );
        setChatLoading(false);
        setChatStreaming(false);
      }
    },
    [
      taskId,
      messages,
      addChatMessage,
      updateLastChatMessage,
      setChatLoading,
      setChatStreaming,
    ]
  );

  const hasMessages = messages.length > 0;
  const isThinking =
    isChatLoading && messages.length > 0 && messages[messages.length - 1]?.content === "";

  return (
    <div className="flex flex-col h-full border-l border-border-glass">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border-glass px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-accent-glow">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Task AI</p>
            <p className="text-[10px] text-text-tertiary truncate max-w-[180px]">
              {isChatStreaming ? "Responding..." : taskTitle}
            </p>
          </div>
        </div>
        {hasMessages && (
          <button
            onClick={() => clearChatForTask(taskId)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated/50 transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-glow/20 mb-4">
              <Sparkles className="h-5 w-5 text-accent-primary" />
            </div>
            <p className="text-sm font-medium text-text-primary mb-1">
              Task AI Assistant
            </p>
            <p className="text-xs text-text-tertiary mb-6 max-w-[240px]">
              I have full context on this task, its linked deal, contacts, notes,
              and meeting transcripts. Ask me anything.
            </p>

            {/* Suggested prompts */}
            <div className="space-y-2 w-full">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  disabled={isChatLoading}
                  className="w-full text-left glass-panel-dense rounded-xl px-4 py-2.5 text-xs text-text-secondary hover:text-text-primary hover:border-accent-primary/20 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <AIMessageBubble key={msg.id} message={msg} />
        ))}

        {isThinking && <ThinkingGradient />}
      </div>

      {/* Input */}
      <div className="shrink-0 p-3 border-t border-border-glass">
        <AIInput
          onSend={sendMessage}
          disabled={isChatLoading || isChatStreaming}
        />
      </div>
    </div>
  );
}
