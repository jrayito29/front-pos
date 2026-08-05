import { create } from 'zustand';

interface BreadcrumbState {
  extra: string | null;
  setExtra: (label: string | null) => void;
}

// CLAUDE.md §3 — estado de cliente puro (UI), pero a diferencia de ui.store NO se persiste: el
// segundo nivel del breadcrumb (ej. "Nuevo producto", el nombre de un producto) solo tiene sentido
// mientras la página que lo registró está montada. Breadcrumb.tsx vive en layouts/AppLayout, fuera
// del árbol de cada feature, así que no tiene forma de leer datos propios de la página activa (ej. el
// nombre del producto cargado por `useProducto`) — este store es el canal transitorio para eso. Ver
// hooks/useBreadcrumbExtra.
export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  extra: null,
  setExtra: (label) => set({ extra: label }),
}));
