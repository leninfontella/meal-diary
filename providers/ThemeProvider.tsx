import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeName = 'original' | 'black' | 'brown';

export const themePalettes = {
  original: { background: '#F3F1E9', surface: '#FBFAF5', accent: '#61745B', accentSoft: '#DDE5D8', text: '#292822', muted: '#77736A', line: '#E4E0D5', nav: '#FFFFFF' },
  black: { background: '#090A09', surface: '#202220', accent: '#5F6561', accentSoft: '#303330', text: '#F5F6F1', muted: '#A7AAA2', line: '#363936', nav: '#202220' },
  brown: { background: '#F2E8DA', surface: '#FFF9F0', accent: '#74483B', accentSoft: '#E8D3C2', text: '#4B302A', muted: '#856D62', line: '#DCCABB', nav: '#FFF9F0' },
} as const;

type ThemeContextValue = { name: ThemeName; palette: typeof themePalettes[ThemeName]; setTheme: (theme: ThemeName) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = '@diario-alimentar/theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState<ThemeName>('original');
  useEffect(() => { void AsyncStorage.getItem(STORAGE_KEY).then((saved) => { if (saved === 'original' || saved === 'black' || saved === 'brown') setName(saved); }); }, []);
  const value = useMemo(() => ({ name, palette: themePalettes[name], setTheme: (next: ThemeName) => { setName(next); void AsyncStorage.setItem(STORAGE_KEY, next); } }), [name]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme deve ser usado dentro de ThemeProvider.');
  return value;
}
