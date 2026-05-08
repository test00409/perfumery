"use client";
import { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = {
  primary: string;
  setPrimary: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [primary, setPrimary] = useState("#B3A67C");

  useEffect(() => {
    const saved = localStorage.getItem("PRIMARY_COLOR");
    if (saved) setPrimary(saved);
  }, []);

  const updatePrimary = (color: string) => {
    setPrimary(color);
    localStorage.setItem("PRIMARY_COLOR", color);
  };

  return (
    <ThemeContext.Provider value={{ primary, setPrimary: updatePrimary }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
};
