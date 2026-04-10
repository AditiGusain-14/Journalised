import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "warm";

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
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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
