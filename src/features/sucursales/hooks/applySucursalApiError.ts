import type { FieldValues, UseFormSetError } from 'react-hook-form';
import type { ApiError } from '../../../services/apiClient';
import { applyApiError } from '../../../lib/applyApiError';
import { SUCURSAL_ERROR_CODE_TO_FIELD } from '../constants/sucursal.constants';

export function applySucursalApiError<T extends FieldValues>(error: ApiError, setError: UseFormSetError<T>): boolean {
  return applyApiError(error, setError, SUCURSAL_ERROR_CODE_TO_FIELD);
}
