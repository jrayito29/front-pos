// Constantes de dominio del módulo de Sucursales y Almacenes. Espejo 1:1 de
// api-pos/src/constants/sucursales.constants.ts (SPEC-014, api-pos). Ref: SPEC-012.

export const SUCURSAL_ERRORS = {
  NOT_FOUND: 'ERR_SUCURSAL_NOT_FOUND',
  CODIGO_DUPLICADO: 'ERR_SUCURSAL_CODIGO_DUPLICADO',
  CODIGO_PREFIJO_INVALIDO: 'ERR_SUCURSAL_CODIGO_PREFIJO_INVALIDO',
  INACTIVA: 'ERR_SUCURSAL_INACTIVA',
} as const;

export const ALMACEN_ERRORS = {
  NOT_FOUND: 'ERR_ALMACEN_NOT_FOUND',
  CODIGO_DUPLICADO: 'ERR_ALMACEN_CODIGO_DUPLICADO',
  CON_STOCK: 'ERR_ALMACEN_CON_STOCK',
  TIPO_DUPLICADO: 'ERR_ALMACEN_TIPO_DUPLICADO',
} as const;

// SPEC-012 REQ-X4 — códigos de negocio (409/400 sin `details` de Zod) mapeables a un campo visible
// del formulario de Sucursal, mismo criterio que CATEGORIA_ERROR_CODE_TO_FIELD. Apunta a
// `codigoSufijo` (nombre del campo en el formulario RHF, SPEC-012 REQ-U4) — no a
// `codigoPersonalizable` (nombre del campo en el payload de la API): son distintos a propósito, el
// prefijo "SUC-" se concatena recién en el submit.
export const SUCURSAL_ERROR_CODE_TO_FIELD: Record<string, string> = {
  [SUCURSAL_ERRORS.CODIGO_DUPLICADO]: 'codigoSufijo',
  [SUCURSAL_ERRORS.CODIGO_PREFIJO_INVALIDO]: 'codigoSufijo',
};

// SPEC-012 REQ-X5 — TIPO_DUPLICADO no debería ocurrir en el flujo normal (el frontend solo crea
// almacenes con tipo PERSONALIZADO, no sujeto a unicidad por tipo); se deja fuera del mapeo a campo
// a propósito, se maneja como toast (red de seguridad).
export const ALMACEN_ERROR_CODE_TO_FIELD: Record<string, string> = {
  [ALMACEN_ERRORS.CODIGO_DUPLICADO]: 'codigoPersonalizable',
};

// Claves del catálogo dinámico de permisos (SPEC-003, api-pos) — dos módulos independientes aunque
// hoy compartan matriz de roles. Ref: SPEC-014 v1.2.0 §Roles por Operación, SPEC-012 REQ-U9.
export const SUCURSAL_ACCION = {
  VER: 'sucursales.ver',
  CREAR: 'sucursales.crear',
  EDITAR: 'sucursales.editar',
  CAMBIAR_ESTADO: 'sucursales.cambiar_estado',
} as const;

export const ALMACEN_ACCION = {
  VER: 'almacenes.ver',
  CREAR: 'almacenes.crear',
  EDITAR: 'almacenes.editar',
  CAMBIAR_ESTADO: 'almacenes.cambiar_estado',
} as const;

// Tipos de almacén — independientes del enum de Prisma del backend. Espejo de TIPO_ALMACEN en
// api-pos/src/constants/sucursales.constants.ts.
export const TIPO_ALMACEN = {
  VENTAS: 'VENTAS',
  MERMAS: 'MERMAS',
  TRANSITO: 'TRANSITO',
  RESERVA: 'RESERVA',
  APARTADOS: 'APARTADOS',
  PERSONALIZADO: 'PERSONALIZADO',
} as const;

export type TipoAlmacenDomain = (typeof TIPO_ALMACEN)[keyof typeof TIPO_ALMACEN];

export const TIPO_ALMACEN_LABEL: Record<TipoAlmacenDomain, string> = {
  [TIPO_ALMACEN.VENTAS]: 'Ventas',
  [TIPO_ALMACEN.MERMAS]: 'Mermas',
  [TIPO_ALMACEN.TRANSITO]: 'Tránsito',
  [TIPO_ALMACEN.RESERVA]: 'Reserva',
  [TIPO_ALMACEN.APARTADOS]: 'Apartados',
  [TIPO_ALMACEN.PERSONALIZADO]: 'Personalizado',
};

// SPEC-012 REQ-U8 — configuración de los 5 almacenes que se muestran en la sección "Almacenes que
// se crearán" de SucursalCrearForm; la creación real ocurre en el backend en una sola transacción
// (SPEC-014 §Almacenes Auto-creados). El orden importa: Ventas siempre primero.
export interface AlmacenDefaultInfo {
  tipo: Exclude<TipoAlmacenDomain, 'PERSONALIZADO'>;
  nombre: string;
  obligatorio: boolean;
  flag?: 'incluirReserva' | 'incluirApartados';
  description: string
}

export const ALMACENES_DEFAULT_INFO: AlmacenDefaultInfo[] = [
  { tipo: TIPO_ALMACEN.VENTAS, nombre: 'Almacén de Ventas', obligatorio: true, description: 'Almacén principal de exhibición y venta al público.' },
  { tipo: TIPO_ALMACEN.MERMAS, nombre: 'Almacén de Mermas y Devoluciones', obligatorio: true, description: 'Registro de devoluciones, mermas y productos dañados.' },
  { tipo: TIPO_ALMACEN.TRANSITO, nombre: 'Almacén de Tránsito', obligatorio: true, description: 'Virtual: stock en tránsito entre sucursales durante un traspaso.' },
  { tipo: TIPO_ALMACEN.RESERVA, nombre: 'Bodega de Reserva', obligatorio: false, flag: 'incluirReserva', description: 'Bodega trasera o stock de reserva físico.' },
  { tipo: TIPO_ALMACEN.APARTADOS, nombre: 'Almacén de Apartados', obligatorio: false, flag: 'incluirApartados', description: 'Virtual: stock reservado por anticipos de clientes.' },
];
