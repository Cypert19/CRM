"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useDevice } from "@/components/providers/mobile-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileTopbar } from "@/components/layout/mobile-topbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
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
  const { isMobile } = useDevice();

  return (
    <QuickCreateProvider>
      <div className="min-h-screen">
        <WorkspaceGuard />
        <Sidebar />
        <Topbar />
        <MobileTopbar />
        <MobileBottomNav />
        <MobileDrawer />
        <CommandPalette />
        <AIPanel />
        <FocusModeOverlay />
        <main
          className={cn(
            "transition-[margin-left] duration-200",
            isMobile
              ? "ml-0 pt-14 pb-20"
              : cn("pt-16", sidebarCollapsed ? "ml-[72px]" : "ml-[260px]")
          )}
        >
          <div className={cn(isMobile ? "p-4" : "p-8")}>{children}</div>
        </main>
      </div>
    </QuickCreateProvider>
  );
}
