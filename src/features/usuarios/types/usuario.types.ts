// DTOs del módulo de Usuarios. Espejo 1:1 de api-pos/src/interfaces/usuarios.interfaces.ts
// (SPEC-013) — no se importan directamente, proyectos separados. Ref: SPEC-011.
import type { RolAsignable } from '../constants/usuario.constants';

export interface UsuarioCreadoDTO {
  usuarioId: string;
  email: string;
  role: RolAsignable;
  nombre: string;
  apellidoPaterno: string;
  // SECURITY: texto plano — devuelto UNA sola vez en esta respuesta. Nunca loguear ni persistir más
  // allá del estado local de UsuarioCreadoModal (SPEC-011 REQ-U7, CLAUDE.md §9).
  contraseñaTemporal: string;
  passwordTempExpires: string;
}

export interface RolActualizadoDTO {
  usuarioId: string;
  email: string;
  rolAnterior: string;
  rolNuevo: RolAsignable;
}

export interface UsuarioPerfil {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  telefono: string | null;
}

// GET /api/v1/usuarios/:id — a diferencia de UsuarioListItemDTO, trae `perfil.telefono`.
export interface UsuarioDetalleDTO {
  usuarioId: string;
  email: string;
  role: string;
  perfil: UsuarioPerfil;
  createdAt: string;
}

// GET /api/v1/usuarios (listado) — shape reducido, sin `telefono` (SPEC-011 REQ-U4).
export interface UsuarioListItemDTO {
  usuarioId: string;
  email: string;
  role: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  createdAt: string;
}

// GET /api/v1/usuarios — listado paginado/filtrado, consumido por UsuariosListPage. El backend nombra
// el parámetro de búsqueda `search` (no `q`, a diferencia de Categorías/Productos) — ver
// usuarios-gestion.spec.md §Query Params.
export interface ListarUsuariosParams {
  search?: string;
  role?: RolAsignable;
  page: number;
  limit: number;
}

export interface ListarUsuariosResult {
  usuarios: UsuarioListItemDTO[];
  meta: { page: number; limit: number; total: number };
}
