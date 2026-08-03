import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { useLogin } from '../../../src/features/auth/hooks/useLogin';
import { useSessionStore } from '../../../src/stores/session.store';
import * as authService from '../../../src/features/auth/services/auth.service';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const navigateMock = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => navigateMock };
});

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => {
  useSessionStore.getState().clearSession();
  vi.clearAllMocks();
});

describe('useLogin', () => {
  // spec:SPEC-007:REQ-U7
  it('LoginTenantResponse: persiste usuarioId/empresaId explícitos en la sesión de tenant', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      usuarioId: 'usuario-1',
      empresaId: 'empresa-1',
      perfilCompleto: true,
    });

    const { result } = renderHook(() => useLogin(), { wrapper });
    result.current.mutate({ email: 'ana@deccode.mx', password: 'secreta' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(useSessionStore.getState().accessToken).toBe('access-1');
    expect(useSessionStore.getState().usuarioId).toBe('usuario-1');
    expect(useSessionStore.getState().empresaId).toBe('empresa-1');
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  // spec:SPEC-007:REQ-U7 (adenda) — LoginSysAdminResponse no trae usuarioId/empresaId; usa
  // setSysAdminSession en vez de setTenantSession para no forzar esos campos.
  it('LoginSysAdminResponse: persiste la sesión vía setSysAdminSession sin usuarioId/empresaId', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue({
      accessToken: 'access-sysadmin',
      refreshToken: 'refresh-1',
    });

    const { result } = renderHook(() => useLogin(), { wrapper });
    result.current.mutate({ email: 'sysadmin@deccode.mx', password: 'secreta' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(useSessionStore.getState().accessToken).toBe('access-sysadmin');
    expect(useSessionStore.getState().usuarioId).toBeNull();
    expect(useSessionStore.getState().empresaId).toBeNull();
    expect(navigateMock).toHaveBeenCalledWith('/admin');
  });

  // spec:SPEC-004... (REQ-E6, sin cambios por SPEC-007) — LoginOnboardingResponse sigue su propia rama.
  it('LoginOnboardingResponse: persiste la sesión de onboarding y navega a completar-perfil', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue({
      onboardingToken: 'onboarding-1',
      refreshToken: 'refresh-1',
      usuarioId: 'usuario-1',
      perfilCompleto: false,
    });

    const { result } = renderHook(() => useLogin(), { wrapper });
    result.current.mutate({ email: 'ana@deccode.mx', password: 'secreta' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(useSessionStore.getState().onboardingToken).toBe('onboarding-1');
    expect(useSessionStore.getState().usuarioId).toBe('usuario-1');
    expect(navigateMock).toHaveBeenCalledWith('/completar-perfil');
  });
});
