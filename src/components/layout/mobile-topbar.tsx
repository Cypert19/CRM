"use client";

import Image from "next/image";
import { Menu, Plus, Sparkles, Search } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useQuickCreate } from "@/components/layout/quick-create-provider";
import { Target, Users, Building2, CheckSquare, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const quickCreateItems = [
  { icon: Target, label: "Deal", action: "deal" as const, color: "text-accent-primary" },
  { icon: Users, label: "Contact", action: "contact" as const, color: "text-accent-cyan" },
  { icon: Building2, label: "Company", action: "company" as const, color: "text-accent-purple" },
  { icon: CheckSquare, label: "Task", action: "task" as const, color: "text-signal-success" },
  { icon: FileText, label: "Note", action: "note" as const, color: "text-signal-warning" },
] as const;

export function MobileTopbar() {
  const { toggleMobileMenu, toggleCommandPalette, toggleAIPanel } = useUIStore();
  const { openDeal, openContact, openCompany, openTask, openNote } = useQuickCreate();

  const handleQuickCreate = (action: (typeof quickCreateItems)[number]["action"]) => {
    switch (action) {
      case "deal": openDeal(); break;
      case "contact": openContact(); break;
      case "company": openCompany(); break;
      case "task": openTask(); break;
      case "note": openNote(); break;
    }
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border-glass bg-bg-surface/80 px-3 backdrop-blur-md safe-area-top md:hidden">
      {/* Left: Hamburger */}
      <button
        onClick={toggleMobileMenu}
        className="focus-ring flex h-10 w-10 items-center justify-center rounded-lg text-text-primary transition-colors hover:bg-bg-card/50"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Center: Logo */}
      <Image
        src="/avolis-icon.png"
        alt="Nexus AI"
        width={40}
        height={40}
        className="h-8 w-8 object-contain"
        style={{ mixBlendMode: "screen" }}
        priority
      />

      {/* Right: Actions */}
      <div className="flex items-center gap-0.5">
        {/* Search */}
        <button
          onClick={toggleCommandPalette}
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:text-text-primary"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Quick Create */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="focus-ring gradient-button flex h-10 w-10 items-center justify-center rounded-lg"
              aria-label="Quick add"
            >
              <Plus className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-52">
            <DropdownMenuLabel>Quick Create</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {quickCreateItems.map((item) => (
              <DropdownMenuItem
                key={item.action}
                onClick={() => handleQuickCreate(item.action)}
                className="cursor-pointer gap-3 px-3 py-2.5"
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg bg-bg-elevated/80",
                    item.color
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-medium">New {item.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* AI Toggle */}
        <button
          onClick={toggleAIPanel}
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-lg text-accent-cyan transition-colors hover:bg-accent-cyan/10"
          aria-label="AI Assistant"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
