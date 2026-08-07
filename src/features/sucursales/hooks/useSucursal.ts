import { useQuery } from '@tanstack/react-query';
import { sucursalQueryKey } from '../../../constants/queryKeys';
import { obtenerSucursal } from '../services/sucursal.service';

// GET /api/v1/sucursales/:id — consumido por SucursalDetallePage (Ver/Editar). `enabled` evita
// disparar la query con `id` undefined en el primer render de la ruta, y permite desactivarla
// cuando el rol activo no tiene `sucursales.ver`. Ref: SPEC-012 REQ-U6, REQ-X3, REQ-X8.
export function useSucursal(id: string | undefined, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: sucursalQueryKey(id),
    queryFn: () => obtenerSucursal(id as string),
    enabled: Boolean(id) && (options.enabled ?? true),
  });
}
