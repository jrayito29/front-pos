import { useQuery } from '@tanstack/react-query';
import { usuariosQueryKey } from '../../../constants/queryKeys';
import { listarUsuarios } from '../services/usuario.service';
import type { ListarUsuariosParams } from '../types/usuario.types';

// Listado paginado/filtrado, consumido por UsuariosListPage. `enabled` permite desactivar la
// petición cuando el rol activo no es `superadmin` — mismo criterio defensivo que
// useCategorias/useProductos, aunque la ruta ya está protegida por app/RequireRole.
export function useUsuarios(filtros: ListarUsuariosParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: usuariosQueryKey(filtros),
    queryFn: () => listarUsuarios(filtros),
    enabled: options.enabled ?? true,
  });
}
