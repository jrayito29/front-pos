import { Outlet } from 'react-router';

// SPEC-008 REQ-U6/U7/U8 — único scroll permitido en todo el layout, y solo vertical
// (`overflow-x-hidden`). El difuminado inferior vive en un `position: absolute` dentro de este
// wrapper `relative`, hermano del contenedor con scroll (no dentro de él): la primera versión usaba
// `position: sticky` con margen negativo dentro del propio scroller y resultaba invisible cuando el
// contenido no desbordaba, porque el gradiente terminaba en el mismo color que ya tenía el fondo
// detrás — ver wireframe de SPEC-008.
export function ContentArea() {
  return (
    <div className="relative min-h-0 flex-1">
      <div className="h-full overflow-y-auto overflow-x-hidden px-6 py-1">
        <Outlet />
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-background-secondary"
        aria-hidden="true"
      />
    </div>
  );
}
