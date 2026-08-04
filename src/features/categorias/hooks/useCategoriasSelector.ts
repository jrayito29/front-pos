import { useQuery } from '@tanstack/react-query';
import { categoriasSelectorQueryKey } from '../../../constants/queryKeys';
import { selectorCategorias } from '../services/categoria.service';
import type { SelectorCategoriasParams } from '../types/categoria.types';

// GET /categorias/selector no exige rol (solo autenticación, SPEC-020 §Roles por Operación) —
// cualquier usuario que pueda ver la vista de Productos puede consultarlo.
export function useCategoriasSelector(params: SelectorCategoriasParams, enabled = true) {
  return useQuery({
    queryKey: categoriasSelectorQueryKey(params),
    queryFn: () => selectorCategorias(params),
    enabled,
  });
}
