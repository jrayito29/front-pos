// Tipos propios del front, recreados 1:1 desde api-pos/src/interfaces/permisos.interfaces.ts y
// api-pos/src/constants/permisos.constants.ts (no se importan directamente — proyectos separados).
// Ver SPEC-007 §Dependencias.

export const FUENTE_PERMISO = {
  PLAN: 'plan',
  EMPRESA: 'empresa',
  ROL_EMPRESA: 'rolEmpresa',
  GLOBAL: 'global',
  USUARIO: 'usuario',
} as const;

export type FuentePermiso = (typeof FUENTE_PERMISO)[keyof typeof FUENTE_PERMISO];

export interface AccionEfectiva {
  clave: string;
  permitido: boolean;
  fuente: FuentePermiso;
  esOverride: boolean;
}

export interface ModuloEfectivo {
  // Formato "modulo.<clave>"
  modulo: string;
  activo: boolean;
  soloAdmin: boolean;
  fuenteModulo: FuentePermiso;
  esOverrideModulo: boolean;
  acciones: AccionEfectiva[];
}

// Respuesta de GET /auth/permisos (self-service, REQ-U1). Ref: RESPUESTA-001-permisos-self-service.md
export interface PermisosEfectivosUsuario {
  userId: string;
  role: string;
  modulos: ModuloEfectivo[];
}
