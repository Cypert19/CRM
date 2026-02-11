"use client";

import {
  Search,
  Plus,
  Bell,
  Sparkles,
  LogOut,
  Target,
  Users,
  Building2,
  CheckSquare,
  FileText,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useQuickCreate } from "@/components/layout/quick-create-provider";

const quickCreateItems = [
  { icon: Target, label: "Deal", action: "deal" as const, color: "text-accent-primary" },
  { icon: Users, label: "Contact", action: "contact" as const, color: "text-accent-cyan" },
  { icon: Building2, label: "Company", action: "company" as const, color: "text-accent-purple" },
  { icon: CheckSquare, label: "Task", action: "task" as const, color: "text-signal-success" },
  { icon: FileText, label: "Note", action: "note" as const, color: "text-signal-warning" },
] as const;

export function Topbar() {
  const router = useRouter();
  const { sidebarCollapsed, toggleCommandPalette, toggleAIPanel } = useUIStore();
  const { openDeal, openContact, openCompany, openTask, openNote } = useQuickCreate();

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleQuickCreate = (action: (typeof quickCreateItems)[number]["action"]) => {
    switch (action) {
      case "deal":
        openDeal();
        break;
      case "contact":
        openContact();
        break;
      case "company":
        openCompany();
        break;
      case "task":
        openTask();
        break;
      case "note":
        openNote();
        break;
    }
  };

  return (
    <header
      className={cn(
        "fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border-glass bg-bg-surface/80 px-6 backdrop-blur-md transition-[left] duration-200",
        sidebarCollapsed ? "left-[72px]" : "left-[260px]"
      )}
    >
      {/* Search */}
      <button
        onClick={toggleCommandPalette}
        className="focus-ring flex items-center gap-2 rounded-xl bg-bg-card/50 px-4 py-2 text-sm text-text-tertiary transition-colors hover:text-text-secondary"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-8 rounded bg-bg-elevated px-1.5 py-0.5 text-xs text-text-tertiary">
          &#8984;K
        </kbd>
      </button>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Add Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="focus-ring gradient-button flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
              aria-label="Quick add"
            >
              <Plus className="h-4 w-4" />
              <span>New</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
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
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-accent-cyan transition-colors hover:bg-accent-cyan/10"
          aria-label="Toggle AI assistant"
        >
          <Sparkles className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <button
          className="focus-ring relative flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:text-text-primary"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* User Menu / Sign Out */}
        <button
          onClick={handleSignOut}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:text-text-primary"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
