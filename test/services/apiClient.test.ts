import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { apiClient, refreshTenantAccessToken } from '../../src/services/apiClient';
import { useSessionStore } from '../../src/stores/session.store';
import { ROUTES } from '../../src/constants/routes';
import { permisosQueryKey } from '../../src/constants/queryKeys';
import { queryClient } from '../../src/app/queryClient';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

function okResponse(data: unknown, config: InternalAxiosRequestConfig): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config };
}

function tokenError(config: InternalAxiosRequestConfig, code: string) {
  return {
    message: code,
    isAxiosError: true,
    config,
    response: { data: { success: false, error: { code, message: code } }, status: 401, statusText: '', headers: {}, config },
  };
}

const originalLocation = window.location;
const assignMock = vi.fn();

describe('apiClient', () => {
  beforeEach(() => {
    useSessionStore.getState().clearSession();
    // jsdom no permite `vi.spyOn(window.location, 'assign')` (propiedad no configurable) —
    // se reemplaza el objeto `location` completo por uno con `assign` espiable.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign: assignMock },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    useSessionStore.getState().clearSession();
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  // spec:SPEC-004:REQ-U10
  it('usa onboardingToken como Bearer y adjunta x-usuario-id cuando no hay accessToken, sin enviar x-empresa-id', async () => {
    useSessionStore.getState().setOnboardingSession({
      onboardingToken: 'onboarding-xyz',
      refreshToken: 'refresh-xyz',
      usuarioId: 'usuario-9',
    });

    let captured: InternalAxiosRequestConfig | undefined;
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      captured = config;
      return okResponse({ success: true, data: {} }, config);
    }) as AxiosAdapter;

    await apiClient.get('/cualquier-ruta-onboarding');

    expect(captured?.headers.get('Authorization')).toBe('Bearer onboarding-xyz');
    expect(captured?.headers.get('x-usuario-id')).toBe('usuario-9');
    expect(captured?.headers.get('x-empresa-id')).toBeFalsy();
  });

  // spec:SPEC-004:REQ-U10
  it('prioriza accessToken sobre onboardingToken cuando ambos existen', async () => {
    useSessionStore.setState({ accessToken: 'access-1', onboardingToken: 'onboarding-1', usuarioId: 'usuario-9' });

    let captured: InternalAxiosRequestConfig | undefined;
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      captured = config;
      return okResponse({ success: true, data: {} }, config);
    }) as AxiosAdapter;

    await apiClient.get('/cualquier-ruta-tenant');

    expect(captured?.headers.get('Authorization')).toBe('Bearer access-1');
  });

  // spec:SPEC-007:REQ-U9
  it('adjunta x-usuario-id/x-empresa-id en la rama tenant cuando existen en el store', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });

    let captured: InternalAxiosRequestConfig | undefined;
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      captured = config;
      return okResponse({ success: true, data: {} }, config);
    }) as AxiosAdapter;

    await apiClient.get('/ventas');

    expect(captured?.headers.get('Authorization')).toBe('Bearer access-1');
    expect(captured?.headers.get('x-usuario-id')).toBe('usuario-9');
    expect(captured?.headers.get('x-empresa-id')).toBe('empresa-9');
  });

  // spec:SPEC-007:REQ-U9 (adenda) — sysadmin comparte accessToken pero nunca tiene usuarioId/empresaId
  it('no adjunta x-usuario-id/x-empresa-id en la sesión de sysadmin', async () => {
    useSessionStore.getState().setSysAdminSession({ accessToken: 'access-sysadmin', refreshToken: 'refresh-1' });

    let captured: InternalAxiosRequestConfig | undefined;
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      captured = config;
      return okResponse({ success: true, data: {} }, config);
    }) as AxiosAdapter;

    await apiClient.get('/admin/algo');

    expect(captured?.headers.get('Authorization')).toBe('Bearer access-sysadmin');
    expect(captured?.headers.get('x-usuario-id')).toBeFalsy();
    expect(captured?.headers.get('x-empresa-id')).toBeFalsy();
  });

  // spec:SPEC-004:REQ-X2
  it('ante ERR_TOKEN_EXPIRED refresca la sesión de onboarding y reintenta la petición original una vez', async () => {
    useSessionStore.getState().setOnboardingSession({
      onboardingToken: 'old-token',
      refreshToken: 'refresh-1',
      usuarioId: 'usuario-1',
    });

    let originalAttempts = 0;
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      if (config.url === '/auth/refresh') {
        return okResponse(
          { success: true, data: { onboardingToken: 'new-token', usuarioId: 'usuario-1', perfilCompleto: false } },
          config
        );
      }
      originalAttempts += 1;
      if (originalAttempts === 1) {
        throw tokenError(config, 'ERR_TOKEN_EXPIRED');
      }
      return okResponse({ success: true, data: { ok: true } }, config);
    }) as AxiosAdapter;

    const response = await apiClient.get('/auth/completar-perfil');

    expect(originalAttempts).toBe(2);
    expect(response.data).toEqual({ success: true, data: { ok: true } });
    expect(useSessionStore.getState().onboardingToken).toBe('new-token');
  });

  // spec:SPEC-004:REQ-X2
  it('si el refresh también falla, limpia la sesión, notifica por toast y redirige a /login', async () => {
    useSessionStore.getState().setOnboardingSession({
      onboardingToken: 'old-token',
      refreshToken: 'refresh-1',
      usuarioId: 'usuario-1',
    });

    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      if (config.url === '/auth/refresh') {
        throw tokenError(config, 'ERR_TOKEN_INVALID');
      }
      throw tokenError(config, 'ERR_TOKEN_EXPIRED');
    }) as AxiosAdapter;

    await expect(apiClient.get('/auth/completar-perfil')).rejects.toMatchObject({ code: 'ERR_TOKEN_EXPIRED' });

    expect(useSessionStore.getState().onboardingToken).toBeNull();
    expect(toast.error).toHaveBeenCalled();
    expect(assignMock).toHaveBeenCalledWith(ROUTES.LOGIN);
  });

  // spec:SPEC-005:REQ-U2 / REQ-E2
  it('ante ERR_TOKEN_EXPIRED con accessToken activo, refresca la sesión de tenant y reintenta la petición original una vez', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'old-access', refreshToken: 'refresh-1', usuarioId: 'usuario-1', empresaId: 'empresa-1' });

    let originalAttempts = 0;
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      if (config.url === '/auth/refresh') {
        return okResponse({ success: true, data: { accessToken: 'new-access' } }, config);
      }
      originalAttempts += 1;
      if (originalAttempts === 1) {
        throw tokenError(config, 'ERR_TOKEN_EXPIRED');
      }
      return okResponse({ success: true, data: { ok: true } }, config);
    }) as AxiosAdapter;

    const response = await apiClient.get('/ventas');

    expect(originalAttempts).toBe(2);
    expect(response.data).toEqual({ success: true, data: { ok: true } });
    expect(useSessionStore.getState().accessToken).toBe('new-access');
    // setAccessToken (REQ-U3) no debe tocar refreshToken
    expect(useSessionStore.getState().refreshToken).toBe('refresh-1');
  });

  // spec:SPEC-005:REQ-X2
  it('si el refresh de tenant también falla, limpia la sesión, notifica por toast y redirige a /login', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'old-access', refreshToken: 'refresh-1', usuarioId: 'usuario-1', empresaId: 'empresa-1' });

    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      if (config.url === '/auth/refresh') {
        throw tokenError(config, 'ERR_TOKEN_INVALID');
      }
      throw tokenError(config, 'ERR_TOKEN_EXPIRED');
    }) as AxiosAdapter;

    await expect(apiClient.get('/ventas')).rejects.toMatchObject({ code: 'ERR_TOKEN_EXPIRED' });

    expect(useSessionStore.getState().accessToken).toBeNull();
    expect(toast.error).toHaveBeenCalled();
    expect(assignMock).toHaveBeenCalledWith(ROUTES.LOGIN);
  });

  // spec:SPEC-005:REQ-X3
  it('dedupe: llamadas concurrentes a refreshTenantAccessToken reutilizan la misma promesa, sin duplicar POST /auth/refresh', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'old-access', refreshToken: 'refresh-1', usuarioId: 'usuario-1', empresaId: 'empresa-1' });

    let refreshCalls = 0;
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      if (config.url === '/auth/refresh') {
        refreshCalls += 1;
        return okResponse({ success: true, data: { accessToken: 'new-access' } }, config);
      }
      return okResponse({ success: true, data: {} }, config);
    }) as AxiosAdapter;

    const [first, second] = await Promise.all([
      refreshTenantAccessToken('refresh-1'),
      refreshTenantAccessToken('refresh-1'),
    ]);

    expect(refreshCalls).toBe(1);
    expect(first).toBe('new-access');
    expect(second).toBe('new-access');
  });

  // spec:SPEC-004:REQ-X3
  it('normaliza un error de servidor/red a un ApiError genérico consumible por un toast', async () => {
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      throw { message: 'network down', isAxiosError: true, config };
    }) as AxiosAdapter;

    await expect(apiClient.get('/cualquier-ruta')).rejects.toMatchObject({ code: 'ERR_NETWORK' });
  });

  // spec:SPEC-004:REQ-X5
  it('normaliza un timeout (ECONNABORTED) a ERR_TIMEOUT con mensaje de reintento', async () => {
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      throw { message: 'timeout', isAxiosError: true, code: 'ECONNABORTED', config };
    }) as AxiosAdapter;

    await expect(apiClient.get('/auth/completar-perfil')).rejects.toMatchObject({ code: 'ERR_TIMEOUT' });
  });

  // spec:SPEC-007:REQ-E1
  it('ante ERR_PERMISSION_DENIED (403) en cualquier petición, invalida la query de permisos del usuario activo', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      throw {
        message: 'ERR_PERMISSION_DENIED',
        isAxiosError: true,
        config,
        response: {
          data: { success: false, error: { code: 'ERR_PERMISSION_DENIED', message: 'No tienes permiso.' } },
          status: 403,
          statusText: '',
          headers: {},
          config,
        },
      };
    }) as AxiosAdapter;

    await expect(apiClient.get('/ventas')).rejects.toMatchObject({ code: 'ERR_PERMISSION_DENIED' });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: permisosQueryKey('usuario-9') });
  });
});
