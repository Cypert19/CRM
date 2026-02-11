"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Users,
  Building2,
  CheckSquare,
  FileText,
  FolderOpen,
  BarChart3,
  Sparkles,
  Settings,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Target, label: "Deals", href: "/deals" },
  { icon: Users, label: "Contacts", href: "/contacts" },
  { icon: Building2, label: "Companies", href: "/companies" },
  { icon: CheckSquare, label: "Tasks", href: "/tasks" },
  { icon: FileText, label: "Notes", href: "/notes" },
  { icon: FolderOpen, label: "Files", href: "/files" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
];

const bottomItems = [
  { icon: Sparkles, label: "AI Assistant", href: "/ai", isAI: true },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "glass-panel fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border-glass transition-[width] duration-200",
        sidebarCollapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border-glass px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-accent-cyan">
          <span className="text-xs font-bold text-white">N</span>
        </div>
        {!sidebarCollapsed && (
          <span className="gradient-text text-lg font-bold tracking-tight">
            NexusCRM
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {isActive && (
                <div className="nav-active-glow absolute inset-0 rounded-xl" />
              )}
              {isActive && (
                <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-accent-primary to-accent-glow" />
              )}
              <item.icon
                className={cn(
                  "relative z-10 h-5 w-5 shrink-0",
                  isActive && "text-accent-primary"
                )}
              />
              {!sidebarCollapsed && (
                <span className="relative z-10">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Items */}
      <div className="space-y-1 border-t border-border-glass px-3 py-4">
        {bottomItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "text-text-primary"
                  : "text-text-secondary hover:text-text-primary",
                item.isAI && "text-accent-cyan hover:text-accent-cyan-glow"
              )}
            >
              {isActive && (
                <div className="nav-active-glow absolute inset-0 rounded-xl" />
              )}
              <item.icon className={cn("relative z-10 h-5 w-5 shrink-0", isActive && !item.isAI && "text-accent-primary")} />
              {!sidebarCollapsed && (
                <span className="relative z-10">{item.label}</span>
              )}
            </Link>
          );
        })}

        {/* Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-tertiary transition-colors hover:text-text-secondary"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronsRight className="h-5 w-5 shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="h-5 w-5 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
