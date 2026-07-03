"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type TextSize = "normal" | "large";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  textSize: "normal",
  setTextSize: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [textSize, setTextSize] = useState<TextSize>("normal");

  useEffect(() => {
    const savedTheme = localStorage.getItem("frb-theme") as Theme | null;
    const savedTextSize = localStorage.getItem("frb-text-size") as TextSize | null;
    if (savedTheme) setTheme(savedTheme);
    if (savedTextSize) setTextSize(savedTextSize);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "large-text");

    if (theme === "dark") {
      root.classList.add("dark");
    }

    if (textSize === "large") {
      root.classList.add("large-text");
    }

    localStorage.setItem("frb-theme", theme);
    localStorage.setItem("frb-text-size", textSize);
  }, [theme, textSize]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, textSize, setTextSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}