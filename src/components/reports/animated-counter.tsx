"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type AnimatedCounterProps = {
  value: number;
  format?: "currency" | "number" | "percent" | "days";
  duration?: number;
  className?: string;
};

export function AnimatedCounter({
  value,
  format = "number",
  duration = 1.5,
  className = "",
}: AnimatedCounterProps) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayed(0);
      return;
    }

    const steps = 60;
    const stepDuration = (duration * 1000) / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      // Ease-out cubic
      const progress = 1 - Math.pow(1 - step / steps, 3);
      setDisplayed(Math.round(value * progress));

      if (step >= steps) {
        clearInterval(timer);
        setDisplayed(value);
      }
    }, stepDuration);

    return () => {
      clearInterval(timer);
    };
  }, [value, duration]);

  const formatValue = (v: number) => {
    switch (format) {
      case "currency":
        if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
        if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
        return `$${v.toLocaleString()}`;
      case "percent":
        return `${v}%`;
      case "days":
        return `${v}d`;
      default:
        return v.toLocaleString();
    }
  };

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {formatValue(displayed)}
    </motion.span>
  );
}
