import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ApiError } from '../../../services/apiClient';
import { PRODUCTO_ERROR_CODE_TO_FIELD } from '../constants/producto.constants';

interface ZodIssueLike {
  path: (string | number)[];
  message: string;
}

function isZodIssueArray(details: unknown): details is ZodIssueLike[] {
  return (
    Array.isArray(details) &&
    details.length > 0 &&
    details.every((issue) => typeof issue === 'object' && issue !== null && 'path' in issue && 'message' in issue)
  );
}

// SPEC-009 REQ-E14/E15/E16 — estrategia de dos niveles verificada contra errorHandler.ts/
// validate.middleware.ts reales del backend:
// 1) `error.details` poblado (ZodError con `err.issues`, con o sin código de dominio) → un
//    `setError` por cada issue, cubre múltiples campos inválidos a la vez.
// 2) Sin `details` (AppError de negocio, 409 del service, ej. SKU_DUPLICADO) → tabla estática
//    código→campo.
// Devuelve `true` si logró anclar el error a un campo del formulario; `false` si el llamador debe
// mostrar un toast (no hay campo de RHF equivalente en el contexto de esa acción, ej. transición de
// estado inválida).
export function applyProductoApiError<T extends FieldValues>(error: ApiError, setError: UseFormSetError<T>): boolean {
  if (isZodIssueArray(error.details)) {
    error.details.forEach((issue) => {
      if (issue.path.length > 0) {
        setError(issue.path.join('.') as Path<T>, { message: issue.message });
      }
    });
    return true;
  }

  const field = PRODUCTO_ERROR_CODE_TO_FIELD[error.code];
  if (field) {
    setError(field as Path<T>, { message: error.message });
    return true;
  }

  return false;
}
