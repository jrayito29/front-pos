import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '../../../stores/session.store';
import { permisosQueryKey } from '../../../constants/queryKeys';
import { getMisPermisos } from '../services/permisos.service';
import type { ModuloEfectivo } from '../types/permisos.types';

// SPEC-007 REQ-U2 — dato de servidor, vive en TanStack Query (CLAUDE.md §3), nunca en Zustand.
// `enabled` requiere accessToken (no solo usuarioId, que también existe en la rama onboarding) —
// GET /auth/permisos exige verificarToken + verificarSuscripcion, que la rama onboarding no supera.
export function usePermisos() {
  const usuarioId = useSessionStore((state) => state.usuarioId);
  const accessToken = useSessionStore((state) => state.accessToken);

  return useQuery({
    queryKey: permisosQueryKey(usuarioId),
    queryFn: getMisPermisos,
    enabled: Boolean(accessToken && usuarioId),
  });
}

// SPEC-007 REQ-U3 — derivadas puras a partir del resultado de usePermisos(), calculadas en cada uso
// (CLAUDE.md §9, nunca guardar estado derivable). `undefined` (aún sin cargar o error) resuelve a
// `false` — fail-closed, ver REQ-X1/X2.
export function tieneModuloActivo(modulos: ModuloEfectivo[] | undefined, claveModulo: string): boolean {
  return modulos?.find((m) => m.modulo === claveModulo)?.activo ?? false;
}

export function tieneAccion(modulos: ModuloEfectivo[] | undefined, claveAccion: string): boolean {
  return modulos?.flatMap((m) => m.acciones).find((a) => a.clave === claveAccion)?.permitido ?? false;
}
