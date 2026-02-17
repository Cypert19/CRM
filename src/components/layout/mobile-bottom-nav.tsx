"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Users,
  CheckSquare,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

const tabs = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Target, label: "Deals", href: "/deals" },
  { icon: Users, label: "Contacts", href: "/contacts" },
  { icon: CheckSquare, label: "Tasks", href: "/tasks" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { toggleMobileMenu } = useUIStore();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Hide bottom nav when virtual keyboard is open
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      // If viewport height is significantly less than window height, keyboard is open
      const isKeyboard = vv.height < window.innerHeight * 0.75;
      setKeyboardOpen(isKeyboard);
    };

    vv.addEventListener("resize", handleResize);
    return () => vv.removeEventListener("resize", handleResize);
  }, []);

  if (keyboardOpen) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-[72px] items-center justify-around border-t border-border-glass bg-bg-surface/95 backdrop-blur-xl safe-area-bottom md:hidden">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors",
              isActive
                ? "text-accent-primary"
                : "text-text-tertiary active:text-text-secondary"
            )}
          >
            <tab.icon className="h-6 w-6" />
            <span className="text-[11px] font-medium">{tab.label}</span>
          </Link>
        );
      })}

      {/* More button — opens full drawer */}
      <button
        onClick={toggleMobileMenu}
        className={cn(
          "flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors",
          "text-text-tertiary active:text-text-secondary"
        )}
      >
        <MoreHorizontal className="h-6 w-6" />
        <span className="text-[11px] font-medium">More</span>
      </button>
    </nav>
  );
}
