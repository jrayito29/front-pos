import { afterEach, describe, expect, it } from 'vitest';
import { useUiStore } from '../../src/stores/ui.store';

function flushPersist() {
  // Mismo criterio que session.store.test.ts — `persist` escribe a localStorage en un microtask.
  return new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  useUiStore.setState({ theme: 'light', sidebarCollapsed: false });
  localStorage.clear();
});

describe('ui.store — SPEC-008 REQ-E1/E6', () => {
  // spec:SPEC-008:REQ-E1
  it('toggleSidebarCollapsed alterna el estado y lo persiste en localStorage', async () => {
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);

    useUiStore.getState().toggleSidebarCollapsed();
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
    await flushPersist();

    const raw = localStorage.getItem('ui-preferences');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).state.sidebarCollapsed).toBe(true);

    useUiStore.getState().toggleSidebarCollapsed();
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
  });

  // spec:SPEC-008:REQ-E6
  it('toggleTheme alterna entre light y dark y lo persiste', async () => {
    expect(useUiStore.getState().theme).toBe('light');

    useUiStore.getState().toggleTheme();
    expect(useUiStore.getState().theme).toBe('dark');
    await flushPersist();

    const raw = localStorage.getItem('ui-preferences');
    expect(JSON.parse(raw!).state.theme).toBe('dark');

    useUiStore.getState().toggleTheme();
    expect(useUiStore.getState().theme).toBe('light');
  });
});
