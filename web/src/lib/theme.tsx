"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme-script";

export type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (theme: Theme) => void;
  cycle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system" && typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) || "light";
    setThemeState(stored);
    setResolved(resolveTheme(stored));
    applyTheme(stored);
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      setResolved(resolveTheme("system"));
      applyTheme("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      resolved,
      setTheme: (next: Theme) => {
        setThemeState(next);
        setResolved(resolveTheme(next));
        applyTheme(next);
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      },
      cycle: () => {
        const order: Theme[] = ["light", "dark", "system"];
        const next = order[(order.indexOf(theme) + 1) % order.length];
        setThemeState(next);
        setResolved(resolveTheme(next));
        applyTheme(next);
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      },
    }),
    [theme, resolved],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
