"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, GitBranch, Users, Upload, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const settingsTabs = [
  { label: "Profile", href: "/settings/profile", icon: UserCircle },
  { label: "General", href: "/settings/general", icon: Settings },
  { label: "Pipelines", href: "/settings/pipelines", icon: GitBranch },
  { label: "Members", href: "/settings/members", icon: Users },
  { label: "Import Data", href: "/settings/import", icon: Upload },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <div className="mb-6 flex items-center gap-1 rounded-xl bg-bg-card/50 p-1">
        {settingsTabs.map((tab) => {
          const isActive = pathname === tab.href || pathname?.endsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors",
                isActive
                  ? "bg-bg-elevated text-text-primary font-medium"
                  : "text-text-tertiary hover:text-text-secondary"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
