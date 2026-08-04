import { useQuery } from '@tanstack/react-query';
import { productoQueryKey } from '../../../constants/queryKeys';
import { obtenerProducto } from '../services/producto.service';

// SPEC-009 REQ-U23 — detalle consumido por ProductoDetallePage (Ver/Editar). `enabled` evita disparar
// la query con `id` undefined durante el primer render de la ruta.
export function useProducto(id: string | undefined) {
  return useQuery({
    queryKey: productoQueryKey(id),
    queryFn: () => obtenerProducto(id as string),
    enabled: Boolean(id),
  });
}
