import React, { createContext, useContext, useEffect, useState } from "react";
import { storageService } from "../services/storage";

type Theme = "light" | "dark" | "beige";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const user = localStorage.getItem("insight_journal_user");
    if (user) {
      const userData = JSON.parse(user);
      if (userData.theme === "warm") return "beige";
      return userData.theme || "light";
    }
    return "light";
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    const user = localStorage.getItem("insight_journal_user");
    if (user) {
      const userData = JSON.parse(user);
      userData.theme = newTheme;
      localStorage.setItem("insight_journal_user", JSON.stringify(userData));
      if (userData.id) {
        storageService.saveTheme(userData.id, newTheme).catch(() => {
          // Keep local theme even if backend persistence fails.
        });
      }
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.removeAttribute("data-theme");
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "beige") {
      root.setAttribute("data-theme", "beige");
    }
  }, [theme]);

  useEffect(() => {
    const syncThemeFromBackend = async () => {
      const user = storageService.getUser();
      if (!user?.id) return;
      try {
        const backendTheme = await storageService.getTheme(user.id);
        setThemeState(backendTheme);
      } catch {
        // Keep local fallback.
      }
    };
    syncThemeFromBackend();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
