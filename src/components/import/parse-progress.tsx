"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/gradient-button";

const MESSAGES = [
  "Analyzing file structure…",
  "Identifying entity types…",
  "Extracting companies and contacts…",
  "Parsing deal information…",
  "Mapping relationships…",
  "Detecting notes and tasks…",
  "Finalizing import data…",
];

type Props = {
  message?: string;
  onCancel?: () => void;
};

export function ParseProgress({ message, onCancel }: Props) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (message) return; // Don't cycle if custom message provided
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [message]);

  const displayMessage = message || MESSAGES[messageIndex];

  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* Animated spinner */}
      <div className="relative mb-8">
        <motion.div
          className="h-20 w-20 rounded-full border-2 border-accent-primary/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 h-20 w-20 rounded-full border-2 border-transparent border-t-accent-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-8 w-8 text-accent-primary" />
          </motion.div>
        </div>
      </div>

      {/* Status message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={displayMessage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-sm font-medium text-text-secondary"
        >
          {displayMessage}
        </motion.p>
      </AnimatePresence>

      <p className="mt-2 text-xs text-text-tertiary">
        This may take up to a minute for large files
      </p>

      {/* Cancel button */}
      {onCancel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="mt-6"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
      )}
    </div>
  );
}
