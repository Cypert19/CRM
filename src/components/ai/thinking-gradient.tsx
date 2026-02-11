"use client";

import { motion } from "framer-motion";

export function ThinkingGradient() {
  return (
    <div className="flex items-center justify-center py-6">
      <motion.div
        className="relative h-[120px] w-[120px]"
        animate={{
          scale: [1, 1.05, 0.98, 1.03, 1],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      >
        {/* Primary orb */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 40% 40%, #7C3AED, #06B6D4, #A855F7)",
            filter: "blur(20px)",
          }}
          animate={{
            opacity: [0.4, 0.7, 0.5, 0.6, 0.4],
            rotate: [0, 45, -15, 30, 0],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
        {/* Inner bright core */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, #A855F7, #06B6D4)",
            filter: "blur(4px)",
          }}
          animate={{
            scale: [1, 1.5, 1.2, 1.4, 1],
            opacity: [0.8, 1, 0.7, 0.9, 0.8],
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      </motion.div>
    </div>
  );
}
