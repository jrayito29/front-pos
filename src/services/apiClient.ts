import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { useSessionStore } from '../stores/session.store';
import { ROUTES } from '../constants/routes';
import { permisosQueryKey } from '../constants/queryKeys';
// SPEC-007 REQ-E1 — se importa el singleton de app/ (no al revés) únicamente para invalidar la
// query de permisos ante un 403 de autorización; no hay import en sentido contrario en runtime
// (app/queryClient.ts solo importa el tipo `ApiError` de este archivo, borrado en compilación).
import { queryClient } from '../app/queryClient';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

// SPEC-004 REQ-X2 — respuesta de POST /auth/refresh cuando la sesión vigente es de onboarding.
interface RefreshOnboardingApiResponse {
  success: true;
  data: { onboardingToken: string; usuarioId: string; perfilCompleto: false };
}

// SPEC-005 REQ-U2 — respuesta de POST /auth/refresh cuando la sesión vigente es de tenant.
interface RefreshTenantApiResponse {
  success: true;
  data: { accessToken: string };
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _onboardingRetried?: boolean;
  _tenantRetried?: boolean;
}

// Códigos que disparan un intento de refresh transparente, tanto en la rama onboarding como en la
// rama tenant (SPEC-005 REQ-U2) — mismo criterio de expiración/invalidez de token en ambos casos.
const TOKEN_REFRESH_ERROR_CODES = new Set(['ERR_TOKEN_EXPIRED', 'ERR_TOKEN_INVALID']);

// SPEC-007 REQ-E1 — mismo código que api-pos PERMISOS_ERRORS.PERMISSION_DENIED
// (constants/permisos.constants.ts); el backend revalida permisos en cada request, así que el front
// no puede confiar en su caché ante este código, sin importar qué endpoint lo devolvió.
const PERMISSION_DENIED_ERROR_CODE = 'ERR_PERMISSION_DENIED';

let pendingTenantRefresh: Promise<string> | null = null;

// SPEC-005 REQ-U5/E1/E2/X3 — obtiene un accessToken nuevo vía POST /auth/refresh y lo persiste en
// session.store (setAccessToken, nunca setTenantSession — no debe resetear mustChangePassword/
// requiereSeleccionSucursal ni onboardingToken/usuarioId, que RefreshTenantResponse no trae).
// Deduplicado (REQ-X3): si ya hay un refresh en curso (disparado por el bootstrap de RequireAuth o
// por el interceptor de abajo), las llamadas concurrentes reutilizan la misma promesa en vez de
// disparar POST /auth/refresh por duplicado.
export function refreshTenantAccessToken(refreshToken: string): Promise<string> {
  if (!pendingTenantRefresh) {
    pendingTenantRefresh = apiClient
      .post<RefreshTenantApiResponse>('/auth/refresh', { refreshToken })
      .then(({ data }) => {
        const { accessToken } = data.data;
        useSessionStore.getState().setAccessToken(accessToken);
        return accessToken;
      })
      .finally(() => {
        pendingTenantRefresh = null;
      });
  }
  return pendingTenantRefresh;
}

// CLAUDE.md §6 — interceptor centralizado que normaliza errores del backend a un formato único.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
});

// SPEC-004 REQ-U10 — cuando no hay `accessToken` (sesión de tenant) pero sí `onboardingToken`
// (sesión parcial de completar-perfil), se usa como Bearer y se adjunta `x-usuario-id` — nunca
// `x-empresa-id` en esta rama (el backend la ignora si llega, pero no se envía por contrato).
// SPEC-007 REQ-U9 — en la rama `accessToken` se adjuntan `x-usuario-id`/`x-empresa-id` cuando
// existen en el store; `verificarToken.middleware.ts` los exige en toda ruta tenant. Condicionar a
// que existan (en vez de asumirlos siempre presentes) cubre también la sesión de sysadmin, que
// comparte el campo `accessToken` pero nunca tiene usuarioId/empresaId (setSysAdminSession).
apiClient.interceptors.request.use((config) => {
  const { accessToken, onboardingToken, usuarioId, empresaId } = useSessionStore.getState();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
    if (usuarioId) {
      config.headers.set('x-usuario-id', usuarioId);
    }
    if (empresaId) {
      config.headers.set('x-empresa-id', empresaId);
    }
  } else if (onboardingToken) {
    config.headers.set('Authorization', `Bearer ${onboardingToken}`);
    if (usuarioId) {
      config.headers.set('x-usuario-id', usuarioId);
    }
  }
  return config;
});

function toApiError(error: AxiosError<ApiErrorResponse>): ApiError {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.code === 'ECONNABORTED') {
    return { code: 'ERR_TIMEOUT', message: 'La solicitud tardó demasiado. Intenta de nuevo.' };
  }
  return { code: 'ERR_NETWORK', message: 'No se pudo conectar con el servidor.' };
}

// SPEC-004 REQ-X2 / SPEC-005 REQ-U2 — ante ERR_TOKEN_EXPIRED/ERR_TOKEN_INVALID en una petición
// autenticada, intenta un refresh transparente contra POST /auth/refresh y reintenta la petición
// original una única vez. La rama depende de qué token está activo: `onboardingToken` (sesión
// parcial, SPEC-004) o `accessToken` (sesión de tenant, SPEC-005) — son mutuamente excluyentes
// porque `session.store` nunca tiene ambos a la vez. `_onboardingRetried`/`_tenantRetried` evitan un
// segundo intento sobre la misma petición; comparar `url` contra '/auth/refresh' evita recursión si
// el refresh en sí falla con el mismo código de error.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const apiError = toApiError(error);
    const originalRequest = error.config as RetriableConfig | undefined;
    const { accessToken, onboardingToken, refreshToken, usuarioId } = useSessionStore.getState();

    // SPEC-007 REQ-E1 — invalida antes de que cualquier UI dependiente de usePermisos() se renderice
    // con el resultado desactualizado que causó este 403 (ej. un superadmin revocó el módulo durante
    // la sesión en curso).
    if (apiError.code === PERMISSION_DENIED_ERROR_CODE) {
      queryClient.invalidateQueries({ queryKey: permisosQueryKey(usuarioId) });
    }

    const canRetryOnboarding =
      TOKEN_REFRESH_ERROR_CODES.has(apiError.code) &&
      !accessToken &&
      !!onboardingToken &&
      !!refreshToken &&
      !!originalRequest &&
      originalRequest.url !== '/auth/refresh' &&
      !originalRequest._onboardingRetried;

    // SPEC-005 REQ-U2/E2
    const canRetryTenant =
      TOKEN_REFRESH_ERROR_CODES.has(apiError.code) &&
      !!accessToken &&
      !!refreshToken &&
      !!originalRequest &&
      originalRequest.url !== '/auth/refresh' &&
      !originalRequest._tenantRetried;

    if (canRetryOnboarding) {
      originalRequest._onboardingRetried = true;
      try {
        const { data } = await apiClient.post<RefreshOnboardingApiResponse>('/auth/refresh', { refreshToken });
        useSessionStore.getState().setOnboardingSession({
          onboardingToken: data.data.onboardingToken,
          usuarioId: data.data.usuarioId,
          refreshToken,
        });
        return apiClient(originalRequest);
      } catch {
        useSessionStore.getState().clearSession();
        toast.error('Tu sesión de registro expiró. Inicia sesión de nuevo.');
        window.location.assign(ROUTES.LOGIN);
        return Promise.reject(apiError);
      }
    }

    if (canRetryTenant) {
      originalRequest._tenantRetried = true;
      try {
        await refreshTenantAccessToken(refreshToken);
        return apiClient(originalRequest);
      } catch {
        // SPEC-005 REQ-X2 — a diferencia del fallo del silent-refresh de bootstrap (REQ-X1, sin
        // toast), este fallo interrumpe una acción en curso del usuario: sí se notifica.
        useSessionStore.getState().clearSession();
        toast.error('Tu sesión expiró. Inicia sesión de nuevo.');
        window.location.assign(ROUTES.LOGIN);
        return Promise.reject(apiError);
      }
    }

    return Promise.reject(apiError);
  }
);
