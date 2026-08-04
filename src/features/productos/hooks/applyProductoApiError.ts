import type { FieldValues, UseFormSetError } from 'react-hook-form';
import type { ApiError } from '../../../services/apiClient';
import { applyApiError } from '../../../lib/applyApiError';
import { PRODUCTO_ERROR_CODE_TO_FIELD } from '../constants/producto.constants';

// SPEC-009 REQ-E14/E15/E16 — wrapper delgado sobre `lib/applyApiError.ts` (genérico, extraído aquí
// originalmente) con el catálogo de errores propio de Productos.
export function applyProductoApiError<T extends FieldValues>(error: ApiError, setError: UseFormSetError<T>): boolean {
  return applyApiError(error, setError, PRODUCTO_ERROR_CODE_TO_FIELD);
}
