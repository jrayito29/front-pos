import type { FieldValues, UseFormSetError } from 'react-hook-form';
import type { ApiError } from '../../../services/apiClient';
import { applyApiError } from '../../../lib/applyApiError';
import { ALMACEN_ERROR_CODE_TO_FIELD } from '../constants/sucursal.constants';

export function applyAlmacenApiError<T extends FieldValues>(error: ApiError, setError: UseFormSetError<T>): boolean {
  return applyApiError(error, setError, ALMACEN_ERROR_CODE_TO_FIELD);
}
