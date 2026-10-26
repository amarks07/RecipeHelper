import { useColorScheme } from "react-native";
import { createContext, useContext } from "react";
import { THEME_TOKENS } from "./tokens";

const ThemeContext = createContext();

export function ThemeProvider({ children, theme = "system", accent = "accent" }) {
  const systemTheme = useColorScheme();
  const resolvedTheme = theme === "system" ? systemTheme || "dark" : theme;
  const tokens = THEME_TOKENS[resolvedTheme];

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme, tokens, accent }}>
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
