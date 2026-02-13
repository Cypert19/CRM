"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AIPanel } from "@/components/ai/ai-panel";
import { CommandPalette } from "@/components/ui/command-palette";
import { WorkspaceGuard } from "@/components/workspace-guard";
import { QuickCreateProvider } from "@/components/layout/quick-create-provider";
import { FocusModeOverlay } from "@/components/focus/focus-mode-overlay";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <QuickCreateProvider>
      <div className="min-h-screen">
        <WorkspaceGuard />
        <Sidebar />
        <Topbar />
        <CommandPalette />
        <AIPanel />
        <FocusModeOverlay />
        <main
          className={cn(
            "pt-16 transition-[margin-left] duration-200",
            sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
          )}
        >
          <div className="p-8">{children}</div>
        </main>
      </div>
    </QuickCreateProvider>
  );
}
