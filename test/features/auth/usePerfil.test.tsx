import { afterEach, describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { usePerfil } from '../../../src/features/auth/hooks/usePerfil';
import { useSessionStore } from '../../../src/stores/session.store';
import { apiClient } from '../../../src/services/apiClient';
import type { PerfilUsuarioResponse } from '../../../src/features/auth/types/perfil.types';

function okResponse(data: unknown, config: InternalAxiosRequestConfig): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config };
}

function perfilFixture(): PerfilUsuarioResponse {
  return { nombre: 'Ana García', empresa: { nombre: 'Distribuidora del Norte SA de CV', logoUrl: null } };
}

function renderUsePerfil() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderHook(() => usePerfil(), {
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  });
}

afterEach(() => {
  useSessionStore.getState().clearSession();
});

// RESPUESTA-003-datos-usuario-y-logo-empresa.md — GET /auth/perfil, self-service.
describe('usePerfil', () => {
  it('consulta GET /auth/perfil y devuelve nombre/empresa cuando hay sesión tenant activa', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) =>
      okResponse({ success: true, data: perfilFixture() }, config)) as AxiosAdapter;

    const { result } = renderUsePerfil();

    await waitFor(() => expect(result.current.data).toEqual(perfilFixture()));
  });

  // nombre puede llegar `null` (usuario sin PerfilUsuario) — nunca se inventa un valor (SPEC-008 REQ-X3).
  it('propaga `nombre: null` tal cual, sin sustituirlo por ningún valor inventado', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) =>
      okResponse({ success: true, data: { nombre: null, empresa: { nombre: 'Empresa X', logoUrl: null } } }, config)) as AxiosAdapter;

    const { result } = renderUsePerfil();

    await waitFor(() => expect(result.current.data?.nombre).toBeNull());
  });

  // Mismo criterio que usePermisos: sin usuarioId (sesión sysadmin, setSysAdminSession lo deja
  // `null`) la query nunca se dispara — no hace falta que TenantChrome/SysadminChrome lo distingan.
  it('no dispara la consulta cuando no hay `usuarioId` en sesión (rama sysadmin)', async () => {
    useSessionStore.getState().setSysAdminSession({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    let called = false;
    apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      called = true;
      return okResponse({ success: true, data: perfilFixture() }, config);
    }) as AxiosAdapter;

    const { result } = renderUsePerfil();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(called).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
  });
});
