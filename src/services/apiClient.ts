import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { useSessionStore } from '../stores/session.store';
import { ROUTES } from '../constants/routes';

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
apiClient.interceptors.request.use((config) => {
  const { accessToken, onboardingToken, usuarioId } = useSessionStore.getState();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
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
    const { accessToken, onboardingToken, refreshToken } = useSessionStore.getState();

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
