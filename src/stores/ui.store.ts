import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface UiState {
  theme: Theme;
  sidebarCollapsed: boolean;
}

interface UiActions {
  toggleTheme: () => void;
  toggleSidebarCollapsed: () => void;
}

type UiStore = UiState & UiActions;

// CLAUDE.md §3 — Zustand = solo estado de cliente puro: "preferencias de UI" y "estado de
// sidebar/paneles" están explícitamente listados como su responsabilidad. SPEC-008 REQ-E1/E6.
// Persistido en localStorage (no sessionStorage, a diferencia de session.store): no es sensible y
// debe sobrevivir el cierre del navegador, no solo la pestaña.
export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'ui-preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
