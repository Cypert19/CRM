"use client";

import { createContext, useContext } from "react";
import { useIsMobile, useIsTablet } from "@/hooks/use-media-query";

type DeviceContext = {
  isMobile: boolean;
  isTablet: boolean;
};

const DeviceCtx = createContext<DeviceContext>({
  isMobile: false,
  isTablet: false,
});

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  return (
    <DeviceCtx.Provider value={{ isMobile, isTablet }}>
      {children}
    </DeviceCtx.Provider>
  );
}

export function useDevice() {
  return useContext(DeviceCtx);
}
