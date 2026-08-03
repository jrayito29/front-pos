import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { toast } from 'sonner';
import { useCompletarPerfil } from './useCompletarPerfil';
import { useSessionStore } from '../../../stores/session.store';
import * as authService from '../services/auth.service';
import { COMPLETAR_PERFIL_DEFAULT_VALUES, type CompletarPerfilFormValues } from '../schemas/completarPerfil.schema';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

const navigateMock = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => navigateMock };
});

const formValues: CompletarPerfilFormValues = {
  ...COMPLETAR_PERFIL_DEFAULT_VALUES,
  nombre: 'Ana',
  apellidoPaterno: 'García',
  empresa: { ...COMPLETAR_PERFIL_DEFAULT_VALUES.empresa, nombre: 'Deccode SA de CV' },
};

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

describe('useCompletarPerfil', () => {
  // spec:SPEC-004:REQ-E3
  it('envía el body completo acumulado de los 3 pasos a completarPerfil', async () => {
    const completarPerfilSpy = vi.spyOn(authService, 'completarPerfil').mockResolvedValue({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      empresaId: 'empresa-1',
      perfilCompleto: true,
    });

    const { result } = renderHook(() => useCompletarPerfil(), { wrapper });
    result.current.mutate(formValues);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(completarPerfilSpy.mock.calls[0][0]).toEqual(formValues);
  });

  // spec:SPEC-004:REQ-E4 / spec:SPEC-007:REQ-U7
  it('al resolver con éxito, persiste la sesión de tenant (limpiando onboarding) y navega al dashboard', async () => {
    vi.spyOn(authService, 'completarPerfil').mockResolvedValue({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      empresaId: 'empresa-1',
      perfilCompleto: true,
    });
    useSessionStore
      .getState()
      .setOnboardingSession({ onboardingToken: 'onboarding-1', refreshToken: 'r', usuarioId: 'u1' });

    const { result } = renderHook(() => useCompletarPerfil(), { wrapper });
    result.current.mutate(formValues);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(useSessionStore.getState().accessToken).toBe('access-1');
    expect(useSessionStore.getState().onboardingToken).toBeNull();
    // spec:SPEC-007:REQ-U7 — usuarioId no cambia (PerfilCompletoResponse no lo retorna, se conserva
    // el de la sesión de onboarding); empresaId sí llega en la respuesta.
    expect(useSessionStore.getState().usuarioId).toBe('u1');
    expect(useSessionStore.getState().empresaId).toBe('empresa-1');
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  // spec:SPEC-004:REQ-X1
  it('ante ERR_EMPRESA_ALREADY_EXISTS limpia la sesión y redirige a /login con un toast', async () => {
    vi.spyOn(authService, 'completarPerfil').mockRejectedValue({
      code: 'ERR_EMPRESA_ALREADY_EXISTS',
      message: 'La empresa ya existe',
    });
    useSessionStore
      .getState()
      .setOnboardingSession({ onboardingToken: 'onboarding-1', refreshToken: 'r', usuarioId: 'u1' });

    const { result } = renderHook(() => useCompletarPerfil(), { wrapper });
    result.current.mutate(formValues);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(useSessionStore.getState().onboardingToken).toBeNull();
    expect(toast.error).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });

  // spec:SPEC-004:REQ-X3
  it('ante un error de servidor/red muestra un toast genérico y no navega', async () => {
    vi.spyOn(authService, 'completarPerfil').mockRejectedValue({
      code: 'ERR_NETWORK',
      message: 'No se pudo conectar con el servidor.',
    });

    const { result } = renderHook(() => useCompletarPerfil(), { wrapper });
    result.current.mutate(formValues);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toast.error).toHaveBeenCalledWith('No se pudo conectar con el servidor.');
    expect(navigateMock).not.toHaveBeenCalled();
  });

  // spec:SPEC-004:REQ-X5
  it('ante un timeout, restaura el estado de reposo (isPending vuelve a false) para permitir reintentar sin repetir pasos', async () => {
    vi.spyOn(authService, 'completarPerfil').mockRejectedValue({
      code: 'ERR_TIMEOUT',
      message: 'La solicitud tardó demasiado. Intenta de nuevo.',
    });

    const { result } = renderHook(() => useCompletarPerfil(), { wrapper });
    result.current.mutate(formValues);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.isPending).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('La solicitud tardó demasiado. Intenta de nuevo.');
  });
});
