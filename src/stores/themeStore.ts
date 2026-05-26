import { create } from 'zustand';

const STORAGE_KEY = 'axcp-theme-colors';

const defaultColors: [string, string, string] = ['#2563eb', '#7c3aed', '#06b6d4'];

function loadColors(): [string, string, string] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length === 3) {
        return [String(parsed[0]), String(parsed[1]), String(parsed[2])];
      }
    }
  } catch {}
  return defaultColors;
}

function applyColors(colors: [string, string, string]) {
  document.documentElement.style.setProperty('--color-g-1', colors[0]);
  document.documentElement.style.setProperty('--color-g-2', colors[1]);
  document.documentElement.style.setProperty('--color-g-3', colors[2]);
}

const saved = loadColors();
applyColors(saved);

interface ThemeState {
  gradientColors: [string, string, string];
  setGradientColors: (colors: [string, string, string]) => void;
  resetColors: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  gradientColors: saved,
  setGradientColors: (colors) => {
    applyColors(colors);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
    set({ gradientColors: colors });
  },
  resetColors: () => {
    applyColors(defaultColors);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultColors));
    set({ gradientColors: defaultColors });
  },
}));
