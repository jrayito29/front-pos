// Barrel de la feature Productos — expone únicamente lo que otras partes de la app necesitan
// consumir (CLAUDE.md §3, cada feature autocontenida). `app/router.tsx` importa las páginas de forma
// directa (no vía este barrel) por la misma excepción documentada en SPEC-006 REQ-U1: lazy() por
// archivo propio evita que Vite/Rollup colapse las 3 rutas en un solo chunk async.
export { ProductosListPage } from './pages/ProductosListPage';
export { ProductoCrearPage } from './pages/ProductoCrearPage';
export { ProductoDetallePage } from './pages/ProductoDetallePage';
