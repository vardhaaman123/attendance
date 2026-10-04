import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({ dark: true, toggleDark: () => {} });

export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ dark: true, toggleDark: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
