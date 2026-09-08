import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('attendify_settings') || '{}');
      return settings.darkMode || false;
    } catch { return false; }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');

    try {
      const settings = JSON.parse(localStorage.getItem('attendify_settings') || '{}');
      settings.darkMode = dark;
      localStorage.setItem('attendify_settings', JSON.stringify(settings));
    } catch {}
  }, [dark]);

  const toggleDark = () => setDark(d => !d);

  return (
    <ThemeContext.Provider value={{ dark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
