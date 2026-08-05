import { useQuery } from '@tanstack/react-query';
import { unidadesMedidaQueryKey } from '../../../constants/queryKeys';
import { listarUnidadesMedida } from '../services/unidadMedida.service';
import type { ListarUnidadesMedidaParams } from '../types/unidadMedida.types';

// GET /api/v1/unidades-medida no exige permiso (solo autenticación, SPEC-021 §Roles por Operación) —
// cualquier usuario que pueda ver el form de Productos puede consultarlo.
export function useUnidadesMedida(params: ListarUnidadesMedidaParams) {
  return useQuery({
    queryKey: unidadesMedidaQueryKey(params),
    queryFn: () => listarUnidadesMedida(params),
  });
}
