import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '../../../stores/session.store';
import { permisosQueryKey } from '../../../constants/queryKeys';
import { getMisPermisos } from '../services/permisos.service';
import type { ModuloEfectivo, PermisosEfectivosUsuario } from '../types/permisos.types';

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

// RESPUESTA-003-datos-usuario-y-logo-empresa.md — `accesoTotal` es true únicamente para
// `superadmin`; cuando lo es, `modulos` siempre viene `[]` (el backend no puebla el catálogo
// completo a propósito). Debe revisarse ANTES de resolver cualquier módulo por tieneModuloActivo —
// si no, un superadmin vería el ítem en el menú (si el consumidor ya aplica este chequeo) pero
// RequirePermission lo rechazaría al no encontrar el módulo en un arreglo vacío. `undefined`
// (sin cargar o error) resuelve a `false` — mismo fail-closed que tieneModuloActivo.
export function tieneAccesoTotal(data: PermisosEfectivosUsuario | undefined): boolean {
  return data?.accesoTotal ?? false;
}

// Composición de los tres checks anteriores — cualquier feature que gatee una acción específica del
// catálogo dinámico (SPEC-003) DEBE pasar por este helper, nunca solo por `tieneAccion`: sin el
// bypass de `tieneAccesoTotal`, `superadmin` (que siempre trae `modulos: []`) se resolvería como
// `false` para cualquier acción — mismo riesgo que `tieneModuloActivo` documenta en su propio caso.
export function puedeAccion(data: PermisosEfectivosUsuario | undefined, claveAccion: string): boolean {
  return tieneAccesoTotal(data) || tieneAccion(data?.modulos, claveAccion);
}
