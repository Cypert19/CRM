"use client";

import { useEffect, useCallback, useRef } from "react";
import { X, Sparkles, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/stores/ui-store";
import { useAIStore, type AIMessage } from "@/stores/ai-store";
import { useFocusStore } from "@/stores/focus-store";
import { useDevice } from "@/components/providers/mobile-provider";
import { AIMessageBubble } from "./ai-message";
import { AIInput } from "./ai-input";
import { ThinkingGradient } from "./thinking-gradient";

export function AIPanel() {
  const { aiPanelOpen, setAIPanelOpen } = useUIStore();
  const focusModeActive = useFocusStore((s) => s.isActive);
  const {
    messages,
    isLoading,
    isStreaming,
    addMessage,
    updateLastAssistantMessage,
    setLoading,
    setStreaming,
    clearMessages,
  } = useAIStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Cmd+J shortcut
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        setAIPanelOpen(!aiPanelOpen);
      }
    },
    [aiPanelOpen, setAIPanelOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleSend = async (content: string) => {
    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date(),
    };

    addMessage(userMessage);
    setLoading(true);

    // Add placeholder assistant message
    const assistantMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      createdAt: new Date(),
    };
    addMessage(assistantMessage);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        updateLastAssistantMessage(
          "I'm sorry, I encountered an error. Please check that your API key is configured."
        );
        setLoading(false);
        return;
      }

      setLoading(false);
      setStreaming(true);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          updateLastAssistantMessage(fullText);
        }
      }

      setStreaming(false);
    } catch {
      updateLastAssistantMessage(
        "I'm sorry, I couldn't process your request. Please try again."
      );
      setLoading(false);
      setStreaming(false);
    }
  };

  const { isMobile } = useDevice();

  // Suppress when focus mode is active (focus mode has its own AI chat)
  if (focusModeActive) return null;

  return (
    <AnimatePresence>
      {aiPanelOpen && (
        <motion.div
          initial={isMobile ? { y: "100%" } : { x: "100%" }}
          animate={isMobile ? { y: 0 } : { x: 0 }}
          exit={isMobile ? { y: "100%" } : { x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col border-l border-accent-cyan/20 bg-bg-surface/95 backdrop-blur-xl md:w-[420px]"
          style={{
            boxShadow: "-4px 0 20px rgba(249, 115, 22, 0.1)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-glass px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-accent-cyan">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  Nexus AI
                </h2>
                <p className="text-[10px] text-text-tertiary">
                  {isStreaming ? "Responding..." : "Ready"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearMessages}
                className="focus-ring rounded-lg p-1.5 text-text-tertiary hover:text-text-secondary"
                aria-label="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setAIPanelOpen(false)}
                className="focus-ring rounded-lg p-1.5 text-text-tertiary hover:text-text-secondary"
                aria-label="Close AI panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Pulsing border indicator */}
          {isLoading && (
            <div className="h-0.5 w-full bg-gradient-to-r from-accent-primary via-accent-cyan to-accent-primary thinking-pulse" />
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 rounded-full bg-accent-cyan/10 blur-2xl" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-cyan/20">
                    <Sparkles className="h-7 w-7 text-accent-cyan" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Ask me anything
                </h3>
                <p className="mt-1 max-w-xs text-xs text-text-tertiary">
                  I have full context of your CRM data. Ask about deals,
                  contacts, pipeline metrics, or get help drafting content.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <AIMessageBubble key={msg.id} message={msg} />
                ))}
                {isLoading && messages[messages.length - 1]?.content === "" && (
                  <ThinkingGradient />
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border-glass p-4">
            <AIInput onSend={handleSend} disabled={isLoading || isStreaming} />
            <p className="mt-2 text-center text-[10px] text-text-tertiary">
              Nexus AI can make mistakes. Verify important information.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
