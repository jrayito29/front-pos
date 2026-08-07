// Barrel de la feature Sucursales — módulo de gestión completo (SPEC-012). Las 3 páginas se montan
// vía import directo al archivo en `app/router.tsx` (SPEC-006 REQ-U1/U4, no a través de este
// barrel); este export es para quien SÍ debe consumir la feature desde otro punto (ej. selectores
// de sucursal/almacén que futuras features de Ventas/Inventario/Traspasos necesitarán).
export { SucursalesListPage } from './pages/SucursalesListPage';
export { SucursalCrearPage } from './pages/SucursalCrearPage';
export { SucursalDetallePage } from './pages/SucursalDetallePage';
export type { SucursalDTO, AlmacenDTO, AlmacenResumenDTO } from './types/sucursal.types';
