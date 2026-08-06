import { useQuery } from '@tanstack/react-query';
import { usuarioQueryKey } from '../../../constants/queryKeys';
import { obtenerUsuario } from '../services/usuario.service';

// GET /api/v1/usuarios/:id — consumido por UsuarioDetalleModal, solo mientras esa modal está
// abierta. A diferencia de UsuarioListItemDTO, trae `perfil.telefono` (SPEC-011 REQ-E1).
export function useUsuario(id: string | undefined, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: usuarioQueryKey(id),
    queryFn: () => obtenerUsuario(id as string),
    enabled: Boolean(id) && (options.enabled ?? true),
  });
}
