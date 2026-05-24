"use client";

import { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_KEY = "agentic-code-review-assistant:theme";

function systemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(next: "light" | "dark") {
  document.documentElement.classList.toggle("dark", next === "dark");
  document.documentElement.classList.toggle("light", next === "light");
  document.documentElement.dataset.theme = next;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    const stored = window.localStorage.getItem(THEME_KEY) as Theme | null;
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  });
  const [systemVersion, setSystemVersion] = useState(0);
  const resolvedTheme = theme === "system" ? systemTheme() : theme;

  useLayoutEffect(() => {
    const next = theme === "system" ? systemTheme() : theme;
    applyTheme(next);
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme, systemVersion]);

  useLayoutEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if (theme === "system") setSystemVersion((current) => current + 1);
    };
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    resolvedTheme,
    setTheme: setThemeState,
    toggleTheme: () => setThemeState(() => (resolvedTheme === "dark" ? "light" : "dark")),
  }), [theme, resolvedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
