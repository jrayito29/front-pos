import { useQuery } from '@tanstack/react-query';
import { historialPreciosQueryKey } from '../../../constants/queryKeys';
import { obtenerHistorialPrecios } from '../services/producto.service';
import type { PeriodoHistorial } from '../constants/producto.constants';

// SPEC-009 REQ-U30 — consumido dentro del LazyWidget del tab "Costos y precio". `enabled` respeta el
// gate de rol (REQ-S7): el consumidor solo monta este hook para roles con acceso a historial.
export function useHistorialPrecios(id: string | undefined, periodo: PeriodoHistorial) {
  return useQuery({
    queryKey: historialPreciosQueryKey(id, periodo),
    queryFn: () => obtenerHistorialPrecios(id as string, periodo),
    enabled: Boolean(id),
  });
}
