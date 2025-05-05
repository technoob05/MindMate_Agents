"use client";

import * as React from "react";

type Theme = "dark" | "light" | "ghibli" | "system" | "outer-space" | "pink" | "joy" | "sadness" | "anger" | "fear" | "disgust" | "vietnam";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "light", // Default to light if no preference found
  setTheme: () => null,
};

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "vite-ui-theme", // Using a common key, adjust if needed
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(
    () => (typeof window !== 'undefined' ? localStorage.getItem(storageKey) as Theme : null) || defaultTheme
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;

    root.classList.remove("light", "dark", "ghibli");

    // Add the current theme class directly
    root.classList.add(theme);
  }, [theme]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
    const storedTheme = localStorage.getItem(storageKey) as Theme;
    if (storedTheme && ["light", "dark", "ghibli", "system", "outer-space", "pink", "joy", "sadness", "anger", "fear", "disgust", "vietnam"].includes(storedTheme)) {
        if (storedTheme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            setTheme(systemTheme as Theme);
        } else {
          setTheme(storedTheme);
        }
    } else {
      setTheme(defaultTheme); // Fallback to default
    }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount


  const value = {
    theme,
    setTheme: (theme: Theme) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, theme);
      }
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
