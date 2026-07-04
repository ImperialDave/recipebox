"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

type Theme = "light" | "dark" | "system";
type TextSize = "normal" | "large";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
  textSize: "normal",
  setTextSize: () => {},
});

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [textSize, setTextSize] = useState<TextSize>("normal");

  const applyTheme = useCallback((nextTheme: Theme) => {
    const resolved = resolveTheme(nextTheme);
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    setResolvedTheme(resolved);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("frb-theme") as Theme | null;
    const savedTextSize = localStorage.getItem(
      "frb-text-size",
    ) as TextSize | null;
    if (savedTheme) setTheme(savedTheme);
    if (savedTextSize) setTextSize(savedTextSize);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("frb-theme", theme);
    localStorage.setItem("frb-text-size", textSize);

    const root = document.documentElement;
    root.classList.toggle("large-text", textSize === "large");

    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme, textSize, applyTheme]);

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme, textSize, setTextSize }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
