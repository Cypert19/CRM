"use client";

export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Violet orb — top left */}
      <div
        className="absolute -left-32 -top-32 h-[600px] w-[600px] rounded-full"
        style={{
          background: "var(--color-bg-orb-violet)",
          filter: "blur(120px)",
        }}
      />
      {/* Cyan orb — bottom right */}
      <div
        className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full"
        style={{
          background: "var(--color-bg-orb-cyan)",
          filter: "blur(120px)",
        }}
      />
      {/* Indigo orb — center right */}
      <div
        className="absolute right-1/4 top-1/3 h-[400px] w-[400px] rounded-full"
        style={{
          background: "var(--color-bg-orb-indigo)",
          filter: "blur(120px)",
        }}
      />
    </div>
  );
}
