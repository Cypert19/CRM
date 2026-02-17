"use client";

export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Violet orb — top left (smaller on mobile for performance) */}
      <div
        className="absolute -left-32 -top-32 h-[300px] w-[300px] rounded-full md:h-[600px] md:w-[600px]"
        style={{
          background: "var(--color-bg-orb-violet)",
          filter: "blur(80px)",
        }}
      />
      {/* Cyan orb — bottom right (hidden on mobile) */}
      <div
        className="absolute -bottom-32 -right-32 hidden h-[500px] w-[500px] rounded-full md:block"
        style={{
          background: "var(--color-bg-orb-cyan)",
          filter: "blur(120px)",
        }}
      />
      {/* Indigo orb — center right (hidden on mobile) */}
      <div
        className="absolute right-1/4 top-1/3 hidden h-[400px] w-[400px] rounded-full md:block"
        style={{
          background: "var(--color-bg-orb-indigo)",
          filter: "blur(120px)",
        }}
      />
    </div>
  );
}
