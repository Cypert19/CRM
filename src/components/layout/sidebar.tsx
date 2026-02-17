"use client";

import Image from "next/image";
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
        "glass-panel fixed left-0 top-0 z-40 h-screen flex-col border-r border-border-glass transition-[width] duration-200",
        "hidden md:flex",
        sidebarCollapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border-glass px-4">
        {sidebarCollapsed ? (
          <Image
            src="/avolis-icon.png"
            alt="Avolis"
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 object-contain"
            style={{ mixBlendMode: "screen" }}
            priority
          />
        ) : (
          <Image
            src="/avolis-wordmark.png"
            alt="Avolis"
            width={480}
            height={270}
            className="h-16 w-auto object-contain"
            style={{ mixBlendMode: "screen" }}
            priority
          />
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
                "focus-ring group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
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
              <div
                className={cn(
                  "nav-icon-glass relative z-10",
                  isActive && "nav-icon-glass-active"
                )}
              >
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px]",
                    isActive
                      ? "text-accent-primary drop-shadow-[0_0_6px_rgba(249,115,22,0.4)]"
                      : "text-text-tertiary group-hover:text-text-secondary"
                  )}
                />
              </div>
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
                "focus-ring group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
                isActive
                  ? "text-text-primary"
                  : "text-text-secondary hover:text-text-primary",
                item.isAI && !isActive && "text-accent-primary"
              )}
            >
              {isActive && (
                <div className="nav-active-glow absolute inset-0 rounded-xl" />
              )}
              {isActive && (
                <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-accent-primary to-accent-glow" />
              )}
              <div
                className={cn(
                  "nav-icon-glass relative z-10",
                  isActive && "nav-icon-glass-active",
                  item.isAI && !isActive && "nav-icon-glass-ai"
                )}
              >
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px]",
                    isActive
                      ? "text-accent-primary drop-shadow-[0_0_6px_rgba(249,115,22,0.4)]"
                      : item.isAI
                        ? "text-accent-primary drop-shadow-[0_0_4px_rgba(249,115,22,0.3)]"
                        : "text-text-tertiary group-hover:text-text-secondary"
                  )}
                />
              </div>
              {!sidebarCollapsed && (
                <span className="relative z-10">{item.label}</span>
              )}
            </Link>
          );
        })}

        {/* Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          className="focus-ring group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-text-tertiary transition-colors hover:text-text-secondary"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <div className="nav-icon-glass">
            {sidebarCollapsed ? (
              <ChevronsRight className="h-[18px] w-[18px] text-text-tertiary group-hover:text-text-secondary" />
            ) : (
              <ChevronsLeft className="h-[18px] w-[18px] text-text-tertiary group-hover:text-text-secondary" />
            )}
          </div>
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
