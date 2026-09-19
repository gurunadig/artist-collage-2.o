"use client";

import { useTheme } from "@/lib/theme";

const labels = {
  light: "Light",
  dark: "Dark",
  system: "Auto",
} as const;

export function ThemeToggle() {
  const { theme, cycle } = useTheme();
  return (
    <button
      type="button"
      onClick={cycle}
      title={`Appearance: ${labels[theme]}. Click to change.`}
      className="rounded-full border border-line px-3 py-1.5 text-xs uppercase tracking-wide text-muted hover:border-gold hover:text-foreground"
    >
      {labels[theme]}
    </button>
  );
}
