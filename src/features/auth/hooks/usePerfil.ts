import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '../../../stores/session.store';
import { perfilQueryKey } from '../../../constants/queryKeys';
import { getPerfilUsuario } from '../services/perfil.service';

// Dato de servidor, vive en TanStack Query (CLAUDE.md §3), nunca en Zustand. Mismo criterio de
// `enabled` que usePermisos: la rama sysadmin nunca tiene `usuarioId` en session.store
// (setSysAdminSession), así que la query nunca se dispara ahí — no hace falta un chequeo de rol
// explícito además de este (mismo motivo por el que SysadminChrome no consume este hook).
export function usePerfil() {
  const usuarioId = useSessionStore((state) => state.usuarioId);
  const accessToken = useSessionStore((state) => state.accessToken);

  return useQuery({
    queryKey: perfilQueryKey(usuarioId),
    queryFn: getPerfilUsuario,
    enabled: Boolean(accessToken && usuarioId),
  });
}
