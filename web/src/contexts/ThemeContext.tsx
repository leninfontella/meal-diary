import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeName = 'original' | 'black' | 'brown';
type ThemeContextValue = { theme: ThemeName; setTheme: (theme: ThemeName) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'diario-alimentar-theme';

function initialTheme(): ThemeName {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === 'black' || saved === 'brown' ? saved : 'original';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(initialTheme);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem(STORAGE_KEY, theme); }, [theme]);
  const value = useMemo(() => ({ theme, setTheme: setThemeState }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme deve ser usado dentro de ThemeProvider.');
  return value;
}
