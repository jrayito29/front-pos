import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ApiError } from '../services/apiClient';

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

// Extraído de SPEC-009 REQ-E14/E15/E16 (originalmente solo para Productos) — estrategia de dos
// niveles verificada contra errorHandler.ts/validate.middleware.ts reales del backend, genérica para
// cualquier feature:
// 1) `error.details` poblado (ZodError con `err.issues`, con o sin código de dominio) → un
//    `setError` por cada issue, cubre múltiples campos inválidos a la vez.
// 2) Sin `details` (AppError de negocio, ej. 409 NOMBRE_DUPLICADO) → tabla estática código→campo que
//    cada feature provee según su propio catálogo de errores.
// Devuelve `true` si logró anclar el error a un campo del formulario; `false` si el llamador debe
// mostrar un toast (no hay campo de RHF equivalente en el contexto de esa acción).
export function applyApiError<T extends FieldValues>(
  error: ApiError,
  setError: UseFormSetError<T>,
  errorCodeToField: Record<string, string>
): boolean {
  if (isZodIssueArray(error.details)) {
    error.details.forEach((issue) => {
      if (issue.path.length > 0) {
        setError(issue.path.join('.') as Path<T>, { message: issue.message });
      }
    });
    return true;
  }

  const field = errorCodeToField[error.code];
  if (field) {
    setError(field as Path<T>, { message: error.message });
    return true;
  }

  return false;
}
