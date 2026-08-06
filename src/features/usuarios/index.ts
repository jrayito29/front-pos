// Barrel de la feature Usuarios — expone el módulo de gestión completo (`UsuariosListPage`, montada
// en `/usuarios` — ver `app/router.tsx`, mismo criterio de import directo al archivo que
// Categorías/Productos, SPEC-006 REQ-U1: este export solo es para quien SÍ debe usar el barrel).
export { UsuariosListPage } from './pages/UsuariosListPage';
export type { UsuarioListItemDTO, UsuarioDetalleDTO, UsuarioCreadoDTO } from './types/usuario.types';
