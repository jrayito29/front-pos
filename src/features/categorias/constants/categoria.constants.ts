// Espejo 1:1 de api-pos/src/constants/categorias.constants.ts (SPEC-020, api-pos).
export const CATEGORIA_ERRORS = {
  NOT_FOUND: 'ERR_CATEGORIA_NOT_FOUND',
  NOMBRE_DUPLICADO: 'ERR_CATEGORIA_NOMBRE_DUPLICADO',
  PADRE_NOT_FOUND: 'ERR_CATEGORIA_PADRE_NOT_FOUND',
  JERARQUIA_EXCEDIDA: 'ERR_CATEGORIA_JERARQUIA_EXCEDIDA',
  PADRE_INVALIDO: 'ERR_CATEGORIA_PADRE_INVALIDO',
  CON_SUBCATEGORIAS_ACTIVAS: 'ERR_CATEGORIA_CON_SUBCATEGORIAS_ACTIVAS',
  CON_PRODUCTOS_ASOCIADOS: 'ERR_CATEGORIA_CON_PRODUCTOS_ASOCIADOS',
  CONFIRMACION_REQUERIDA: 'ERR_CATEGORIA_CONFIRMACION_REQUERIDA',
} as const;

// Códigos de negocio (409/404 sin `details` de Zod) que corresponden a un campo visible del
// formulario de registro rápido (nombre, padreId) — mismo criterio que PRODUCTO_ERROR_CODE_TO_FIELD.
export const CATEGORIA_ERROR_CODE_TO_FIELD: Record<string, string> = {
  [CATEGORIA_ERRORS.NOMBRE_DUPLICADO]: 'nombre',
  [CATEGORIA_ERRORS.PADRE_NOT_FOUND]: 'padreId',
  [CATEGORIA_ERRORS.JERARQUIA_EXCEDIDA]: 'padreId',
  [CATEGORIA_ERRORS.PADRE_INVALIDO]: 'padreId',
};

export const ESTADO_CATEGORIA = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
} as const;
export type EstadoCategoriaDomain = (typeof ESTADO_CATEGORIA)[keyof typeof ESTADO_CATEGORIA];

export const ESTADO_CATEGORIA_LABEL: Record<EstadoCategoriaDomain, string> = {
  [ESTADO_CATEGORIA.ACTIVO]: 'Activo',
  [ESTADO_CATEGORIA.INACTIVO]: 'Inactivo',
};

// RESPUESTA-005-cambio-codigo-error-403-categorias.md — Categorías migró de roles estáticos
// (`verificarRoles`) al catálogo dinámico de permisos (SPEC-003, `verificarPermiso`). Reemplaza al
// antiguo `CATEGORIA_ROLES_ESCRITURA` (array hardcodeado contra `data.role`, documentado como deuda
// pendiente en SPEC-009-productos.md hasta que el backend confirmara esta migración). Claves reales
// de las 5 acciones del módulo, formato "<modulo>.<accion>" (SPEC-020 §Roles por Operación) —
// consultar siempre vía `puedeAccion(data, clave)` (features/auth), nunca comparando `data.role`.
export const CATEGORIA_ACCION = {
  VER: 'categorias.ver',
  CREAR: 'categorias.crear',
  EDITAR: 'categorias.editar',
  CAMBIAR_ESTADO: 'categorias.cambiar_estado',
  ELIMINAR: 'categorias.eliminar',
} as const;
