"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  Target,
  Users,
  Building2,
  FileText,
  Sparkles,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    },
    [commandPaletteOpen, setCommandPaletteOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
    }
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const navigate = (path: string) => {
    router.push(path);
    setCommandPaletteOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      />
      <div className="absolute left-1/2 top-[20%] w-full max-w-xl -translate-x-1/2">
        <Command
          className="glass-panel overflow-hidden rounded-2xl"
          shouldFilter={true}
        >
          <div className="flex items-center gap-3 border-b border-border-glass px-4">
            <Search className="h-4 w-4 text-text-tertiary" />
            <Command.Input
              ref={inputRef}
              value={query}
              onValueChange={setQuery}
              placeholder="Search or type a command..."
              className="h-12 w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
            />
            <kbd className="rounded bg-bg-elevated px-1.5 py-0.5 text-[10px] text-text-tertiary">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-text-tertiary">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-text-tertiary">
              <Command.Item onSelect={() => navigate("/deals")} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary aria-selected:bg-bg-elevated aria-selected:text-text-primary">
                <Target className="h-4 w-4" />
                Deals
              </Command.Item>
              <Command.Item onSelect={() => navigate("/contacts")} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary aria-selected:bg-bg-elevated aria-selected:text-text-primary">
                <Users className="h-4 w-4" />
                Contacts
              </Command.Item>
              <Command.Item onSelect={() => navigate("/companies")} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary aria-selected:bg-bg-elevated aria-selected:text-text-primary">
                <Building2 className="h-4 w-4" />
                Companies
              </Command.Item>
              <Command.Item onSelect={() => navigate("/notes")} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary aria-selected:bg-bg-elevated aria-selected:text-text-primary">
                <FileText className="h-4 w-4" />
                Notes
              </Command.Item>
            </Command.Group>

            <Command.Group heading="AI" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-text-tertiary">
              <Command.Item
                onSelect={() => {
                  setCommandPaletteOpen(false);
                  useUIStore.getState().setAIPanelOpen(true);
                }}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-accent-cyan aria-selected:bg-bg-elevated"
              >
                <Sparkles className="h-4 w-4" />
                Ask Nexus AI...
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
