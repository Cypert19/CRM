"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

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

export function MobileDrawer() {
  const pathname = usePathname();
  const router = useRouter();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();

  const close = () => setMobileMenuOpen(false);

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    close();
    router.push("/login");
    router.refresh();
  };

  return (
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={close}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 top-0 z-50 flex w-[280px] flex-col border-r border-border-glass bg-bg-surface/95 backdrop-blur-xl md:hidden"
          >
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-border-glass px-4">
              <Image
                src="/avolis-wordmark.png"
                alt="Nexus AI"
                width={480}
                height={270}
                className="h-12 w-auto object-contain"
                style={{ mixBlendMode: "screen" }}
              />
              <button
                onClick={close}
                className="focus-ring flex h-10 w-10 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:text-text-primary"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
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
                    <span className="relative z-10">{item.label}</span>
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
                    onClick={close}
                    className={cn(
                      "focus-ring group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "text-text-primary"
                        : "text-text-secondary hover:text-text-primary",
                      item.isAI && !isActive && "text-accent-primary"
                    )}
                  >
                    {isActive && (
                      <div className="nav-active-glow absolute inset-0 rounded-xl" />
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
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                );
              })}

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="focus-ring group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                <div className="nav-icon-glass">
                  <LogOut className="h-[18px] w-[18px] text-text-tertiary group-hover:text-text-secondary" />
                </div>
                <span>Sign Out</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
