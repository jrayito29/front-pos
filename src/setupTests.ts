import '@testing-library/jest-dom/vitest';

// jsdom no implementa ResizeObserver (usado por SubMenu de react-pro-sidebar, navConfig.ts §grupo
// "Configuración", SPEC-010 REQ-U8) ni window.matchMedia (usado por react-data-table-component,
// components/DataTable, SPEC-009 REQ-U1). Sin estos stubs, cualquier test que monte el sidebar o una
// vista con DataTable revienta con un ReferenceError/TypeError ajeno a lo que el test intenta probar.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error — stub mínimo, no implementa el contrato completo de ResizeObserver
globalThis.ResizeObserver ??= ResizeObserverStub;

window.matchMedia ??=
  ((query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
