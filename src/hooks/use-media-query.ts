"use client";

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

/** True when viewport is < 768px (mobile phones) */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

/** True when viewport is 768px–1023px (tablets) */
export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}

/** True when viewport is >= 1024px (desktops) */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}
