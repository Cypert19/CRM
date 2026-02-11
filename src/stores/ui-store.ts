import { create } from "zustand";
import type { ViewMode } from "@/types/common";

type UIState = {
  sidebarCollapsed: boolean;
  aiPanelOpen: boolean;
  commandPaletteOpen: boolean;
  dealsViewMode: ViewMode;
  tasksViewMode: ViewMode;
};

type UIActions = {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleAIPanel: () => void;
  setAIPanelOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setDealsViewMode: (mode: ViewMode) => void;
  setTasksViewMode: (mode: ViewMode) => void;
};

export const useUIStore = create<UIState & UIActions>((set) => ({
  sidebarCollapsed: false,
  aiPanelOpen: false,
  commandPaletteOpen: false,
  dealsViewMode: "kanban",
  tasksViewMode: "list",

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleAIPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
  setAIPanelOpen: (open) => set({ aiPanelOpen: open }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setDealsViewMode: (mode) => set({ dealsViewMode: mode }),
  setTasksViewMode: (mode) => set({ tasksViewMode: mode }),
}));
