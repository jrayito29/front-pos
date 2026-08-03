// queryKeys compartidos entre una feature (TanStack Query) y capas de infraestructura fuera de
// `features/` que necesitan invalidar la misma query (ej. services/apiClient.ts, REQ-E1 de
// SPEC-007) sin duplicar el literal del key en dos archivos ni invertir la dirección de dependencia
// (services/ no puede importar de features/, ver CLAUDE.md §3).

// SPEC-007 REQ-U2/E1 — GET /auth/permisos, alcance por usuario de la sesión activa.
export const permisosQueryKey = (usuarioId: string | null) => ['permisos', usuarioId] as const;
