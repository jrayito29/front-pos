// Espejo 1:1 de api-pos/src/constants/producto.constants.ts (SPEC-016) — fuente de verdad de valores
// exactos que la API usa; nunca inventar variaciones aquí. Ref: SPEC-009.

export const TIPO_PRODUCTO = {
  FISICO: 'FISICO',
  SERVICIO: 'SERVICIO',
} as const;
export type TipoProductoDomain = (typeof TIPO_PRODUCTO)[keyof typeof TIPO_PRODUCTO];

// REQ-U14/U34 — usado por TipoIcon (aria-label) y el header de Ver/Editar. Vive en constants/, no en
// TipoIcon.tsx, porque un archivo de componente solo puede exportar componentes (react-refresh/only-export-components).
export const TIPO_LABEL: Record<TipoProductoDomain, string> = {
  [TIPO_PRODUCTO.FISICO]: 'Físico',
  [TIPO_PRODUCTO.SERVICIO]: 'Servicio',
};
export function tipoLabel(tipo: TipoProductoDomain): string {
  return TIPO_LABEL[tipo];
}

export const ESTADO_PRODUCTO = {
  BORRADOR: 'BORRADOR',
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
  DISCONTINUADO: 'DISCONTINUADO',
} as const;
export type EstadoProductoDomain = (typeof ESTADO_PRODUCTO)[keyof typeof ESTADO_PRODUCTO];

export const FUENTE_PRECIO = {
  ORDEN_COMPRA: 'ORDEN_COMPRA',
  AJUSTE_MANUAL: 'AJUSTE_MANUAL',
} as const;
export type FuentePrecioDomain = (typeof FUENTE_PRECIO)[keyof typeof FUENTE_PRECIO];

// SPEC-016 §Constantes — la respuesta de la API devuelve el objeto hidratado { label, key }.
export const UNIDADES_MEDIDA = [
  { label: 'Pieza', key: 'pza' },
  { label: 'Par', key: 'par' },
  { label: 'Docena', key: 'doc' },
  { label: 'Caja', key: 'caj' },
  { label: 'Paquete', key: 'paq' },
  { label: 'Kilogramo', key: 'kg' },
  { label: 'Gramo', key: 'gr' },
  { label: 'Litro', key: 'lt' },
  { label: 'Mililitro', key: 'ml' },
  { label: 'Metro', key: 'mt' },
  { label: 'Centímetro', key: 'cm' },
  { label: 'Hora', key: 'hr' },
  { label: 'Día', key: 'dia' },
] as const;
export const UNIDADES_MEDIDA_KEYS = UNIDADES_MEDIDA.map((u) => u.key);

// SPEC-016 REQ-S1/S2 — matriz de transiciones permitidas, usada por el control de Estado (REQ-S4).
export const TRANSICIONES_ESTADO: Record<EstadoProductoDomain, EstadoProductoDomain[]> = {
  BORRADOR: [ESTADO_PRODUCTO.ACTIVO, ESTADO_PRODUCTO.INACTIVO],
  ACTIVO: [ESTADO_PRODUCTO.INACTIVO, ESTADO_PRODUCTO.DISCONTINUADO],
  INACTIVO: [ESTADO_PRODUCTO.ACTIVO, ESTADO_PRODUCTO.DISCONTINUADO],
  DISCONTINUADO: [ESTADO_PRODUCTO.INACTIVO],
};

export const PERIODO_HISTORIAL_KEYS = ['mes', 'trimestre', 'semestre', 'anual', 'todo'] as const;
export type PeriodoHistorial = (typeof PERIODO_HISTORIAL_KEYS)[number];

// SPEC-009 §Contexto (punto 6) — sin endpoint `GET /tags` en el backend (prisma/seed.ts genera
// `id: uuidv4()` en tiempo de seed, no determinístico). Solo `nombre`/`slug`/`color` son conocidos y
// estables; nunca inventar un `id` aquí — se usa exclusivamente para el filtro por slug (REQ-U9/E1,
// no requiere id) y para pintar color/nombre de tags ya asignados a un producto (que sí traen su
// `id` real desde `GET /:id`). Ver ProductoTagsTab: "agregar" queda deshabilitado hasta que exista
// ese endpoint.
export const TAGS_CATALOGO = [
  { nombre: 'Oferta', slug: 'oferta', color: '#EF4444' },
  { nombre: 'Nuevo ingreso', slug: 'nuevo-ingreso', color: '#22C55E' },
  { nombre: 'Liquidación', slug: 'liquidacion', color: '#F97316' },
  { nombre: 'Más vendido', slug: 'mas-vendido', color: '#EAB308' },
  { nombre: 'Promoción', slug: 'promocion', color: '#A855F7' },
  { nombre: 'Temporada', slug: 'temporada', color: '#06B6D4' },
  { nombre: 'Importado', slug: 'importado', color: '#3B82F6' },
  { nombre: 'Nacional', slug: 'nacional', color: '#10B981' },
  { nombre: 'Premium', slug: 'premium', color: '#6366F1' },
  { nombre: 'Económico', slug: 'economico', color: '#84CC16' },
  { nombre: 'Perecedero', slug: 'perecedero', color: '#F43F5E' },
  { nombre: 'Destacado', slug: 'destacado', color: '#F59E0B' },
  { nombre: 'Sin gluten', slug: 'sin-gluten', color: '#14B8A6' },
  { nombre: 'Orgánico', slug: 'organico', color: '#4ADE80' },
] as const;

// `ProductoResumenDTO.tags` (listado) solo trae `{ slug, color }` (SPEC-016) — este helper resuelve
// el nombre legible para mostrar en la tabla en vez del slug kebab-case crudo.
export function tagNombrePorSlug(slug: string): string {
  return TAGS_CATALOGO.find((tag) => tag.slug === slug)?.nombre ?? slug;
}

// SPEC-009 REQ-U20/U46 — mock estático hasta que exista el módulo real de Categorías en el backend
// (SPEC-016 §TODOs Pendientes: categoriaId/subcategoriaId se guardan sin FK todavía). El backend SÍ
// valida el *formato* UUID de `categoriaId`/`subcategoriaId` (aunque no la FK, ver DESIGN de
// SPEC-016) — estos IDs deben tener forma UUID v4 real, nunca un slug legible, o el `POST`/`PATCH`
// fallaría 400 pese a que la categoría en sí es solo una etiqueta mock. `parentId: null` = categoría
// padre (la única que muestra el selector "Categoría"); `parentId: <uuid>` = subcategoría (hija de
// esa categoría padre, la única que muestra el selector "Subcategoría").
export const CATEGORIAS_MOCK = [
  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000001', nombre: 'Abarrotes', parentId: null },
  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000002', nombre: 'Bebidas', parentId: null },
  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000003', nombre: 'Limpieza', parentId: null },
  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000004', nombre: 'Ropa y calzado', parentId: null },
  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000005', nombre: 'Electrónica', parentId: null },
  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000006', nombre: 'Servicios', parentId: null },
  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000007', nombre: 'Otros', parentId: null },

  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000101', nombre: 'Enlatados', parentId: '3f1a1b2c-4d5e-4f60-8a11-000000000001' },
  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000102', nombre: 'Snacks', parentId: '3f1a1b2c-4d5e-4f60-8a11-000000000001' },
  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000103', nombre: 'Cereales', parentId: '3f1a1b2c-4d5e-4f60-8a11-000000000001' },

  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000201', nombre: 'Refrescos', parentId: '3f1a1b2c-4d5e-4f60-8a11-000000000002' },
  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000202', nombre: 'Jugos', parentId: '3f1a1b2c-4d5e-4f60-8a11-000000000002' },
  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000203', nombre: 'Agua embotellada', parentId: '3f1a1b2c-4d5e-4f60-8a11-000000000002' },

  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000301', nombre: 'Detergentes', parentId: '3f1a1b2c-4d5e-4f60-8a11-000000000003' },
  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000302', nombre: 'Desinfectantes', parentId: '3f1a1b2c-4d5e-4f60-8a11-000000000003' },

  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000401', nombre: 'Playeras', parentId: '3f1a1b2c-4d5e-4f60-8a11-000000000004' },
  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000402', nombre: 'Pantalones', parentId: '3f1a1b2c-4d5e-4f60-8a11-000000000004' },
  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000403', nombre: 'Calzado', parentId: '3f1a1b2c-4d5e-4f60-8a11-000000000004' },

  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000501', nombre: 'Celulares', parentId: '3f1a1b2c-4d5e-4f60-8a11-000000000005' },
  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000502', nombre: 'Audio', parentId: '3f1a1b2c-4d5e-4f60-8a11-000000000005' },

  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000601', nombre: 'Instalación', parentId: '3f1a1b2c-4d5e-4f60-8a11-000000000006' },
  { id: '3f1a1b2c-4d5e-4f60-8a11-000000000602', nombre: 'Reparación', parentId: '3f1a1b2c-4d5e-4f60-8a11-000000000006' },
] as const;

export const CATEGORIAS_PADRE_MOCK = CATEGORIAS_MOCK.filter((c) => c.parentId === null);

export function getSubcategoriasDe(categoriaId: string | undefined): typeof CATEGORIAS_MOCK[number][] {
  if (!categoriaId) return [];
  return CATEGORIAS_MOCK.filter((c) => c.parentId === categoriaId);
}

// SPEC-016 §Códigos de Error — subconjunto usado por el mapeo de errores del front (REQ-E14/E15/E16).
export const PRODUCTO_ERRORS = {
  NOT_FOUND: 'ERR_PRODUCTO_NOT_FOUND',
  SKU_DUPLICADO: 'ERR_PRODUCTO_SKU_DUPLICADO',
  CODIGO_BARRAS_DUPLICADO: 'ERR_PRODUCTO_CODIGO_BARRAS_DUPLICADO',
  UNIDAD_INVALIDA: 'ERR_PRODUCTO_UNIDAD_INVALIDA',
  ESTADO_TRANSICION_INVALIDA: 'ERR_PRODUCTO_ESTADO_TRANSICION_INVALIDA',
  PRECIO_REQUERIDO: 'ERR_PRODUCTO_PRECIO_REQUERIDO',
  SKU_REQUERIDO: 'ERR_PRODUCTO_SKU_REQUERIDO',
  CAMPO_SOLO_FISICO: 'ERR_PRODUCTO_CAMPO_SOLO_FISICO',
  BASCULA_SOLO_FISICO: 'ERR_PRODUCTO_BASCULA_SOLO_FISICO',
  MARGEN_FUERA_DE_RANGO: 'ERR_PRODUCTO_MARGEN_FUERA_DE_RANGO',
  TAG_NOT_FOUND: 'ERR_TAG_NOT_FOUND',
} as const;

// SPEC-009 REQ-E15 — códigos de negocio (409, sin `details` de Zod) que sí corresponden a un campo
// visible del formulario. El resto (transición de estado, tag no encontrado, sku/precio requerido al
// activar) no tiene campo de RHF equivalente en el contexto de su acción — ver REQ-E16.
export const PRODUCTO_ERROR_CODE_TO_FIELD: Record<string, string> = {
  [PRODUCTO_ERRORS.SKU_DUPLICADO]: 'sku',
  [PRODUCTO_ERRORS.CODIGO_BARRAS_DUPLICADO]: 'codigoBarras',
};

// Roles de escritura/historial — mismo criterio que `producto.routes.ts` (rolesEscritura/rolesHistorial)
// en el backend. SPEC-009 REQ-U24/S6/S7/X5.
export const PRODUCTO_ROLES_ESCRITURA = ['superadmin', 'admin'] as const;
export const PRODUCTO_ROLES_HISTORIAL = ['superadmin', 'admin', 'cajero'] as const;
