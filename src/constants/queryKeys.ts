// queryKeys compartidos entre una feature (TanStack Query) y capas de infraestructura fuera de
// `features/` que necesitan invalidar la misma query (ej. services/apiClient.ts, REQ-E1 de
// SPEC-007) sin duplicar el literal del key en dos archivos ni invertir la dirección de dependencia
// (services/ no puede importar de features/, ver CLAUDE.md §3).

// SPEC-007 REQ-U2/E1 — GET /auth/permisos, alcance por usuario de la sesión activa.
export const permisosQueryKey = (usuarioId: string | null) => ['permisos', usuarioId] as const;

// SPEC-008 (RESPUESTA-003-datos-usuario-y-logo-empresa.md) — GET /auth/perfil, alcance por usuario
// de la sesión activa. Query independiente de `permisosQueryKey`: son dos endpoints distintos con
// guards de rol que a futuro pueden divergir (ver esa respuesta, §Puntos 1 y 2).
export const perfilQueryKey = (usuarioId: string | null) => ['perfil', usuarioId] as const;

// SPEC-009 — GET /api/v1/productos (listado paginado/filtrado). `filtros` entra completo en el key
// para que cada combinación de filtros/página tenga su propia entrada de caché (TanStack Query
// serializa el objeto de forma estable).
export const productosQueryKey = (filtros: object) => ['productos', filtros] as const;

// SPEC-009 — GET /api/v1/productos/:id (detalle, consumido por Ver/Editar).
export const productoQueryKey = (id: string | undefined) => ['productos', 'detalle', id] as const;

// SPEC-009 — GET /api/v1/productos/:id/historial-precios (tab Costos y precio, REQ-U30).
export const historialPreciosQueryKey = (id: string | undefined, periodo: string) =>
  ['productos', 'historial-precios', id, periodo] as const;

// SPEC-009 (v1.4.0) — GET /api/v1/categorias/selector (api-pos SPEC-020), consumido por
// CategoriaSelect/SubcategoriaSelect y por cualquier otro módulo que asigne categorías. `params`
// completo en el key para que cada combinación (soloRaiz/padreId/q) tenga su propia entrada de caché.
export const categoriasSelectorQueryKey = (params: object) => ['categorias', 'selector', params] as const;
