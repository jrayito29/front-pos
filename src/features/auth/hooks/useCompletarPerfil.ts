import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { completarPerfil } from '../services/auth.service';
import type { CompletarPerfilFormValues } from '../schemas/completarPerfil.schema';
import type { PerfilCompletoResponse } from '../types/auth.types';
import { useSessionStore } from '../../../stores/session.store';
import { ROUTES } from '../../../constants/routes';
import type { ApiError } from '../../../services/apiClient';

// Códigos ya comunicados/gestionados fuera de este hook — no deben disparar además el toast
// genérico de onError (evita mensajes duplicados). ERR_TOKEN_EXPIRED/ERR_TOKEN_INVALID: el
// interceptor de apiClient ya intentó el refresh transparente (REQ-X2); si el error llega hasta
// aquí es porque el refresh también falló, y el interceptor ya mostró su propio toast y redirigió.
const SILENCED_ERROR_CODES = new Set(['ERR_TOKEN_EXPIRED', 'ERR_TOKEN_INVALID']);

export function useCompletarPerfil() {
  const navigate = useNavigate();
  const setTenantSession = useSessionStore((state) => state.setTenantSession);
  const usuarioId = useSessionStore((state) => state.usuarioId);
  const clearSession = useSessionStore((state) => state.clearSession);

  return useMutation<PerfilCompletoResponse, ApiError, CompletarPerfilFormValues>({
    mutationFn: completarPerfil,
    onSuccess: (data) => {
      // REQ-E4 — setTenantSession ya limpia onboardingToken (ver session.store.ts). `usuarioId` no
      // cambia respecto al login inicial y PerfilCompletoResponse no lo retorna (SPEC-007 REQ-U7
      // adenda) — se conserva el que ya está en el store desde la sesión de onboarding, garantizado
      // por RequireOnboarding (este hook solo se invoca con onboardingToken/usuarioId activos).
      // `navigate` de react-router usa startTransition internamente (navegación diferida), por lo
      // que RequireOnboarding puede re-renderizar con onboardingToken=null MIENTRAS la ruta todavía
      // no cambió — ver el guard tolerante en app/RequireOnboarding.tsx (acepta accessToken como
      // sesión válida) para el porqué esto no termina en un redirect a /login.
      setTenantSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        usuarioId: usuarioId as string,
        empresaId: data.empresaId,
      });
      navigate(ROUTES.DASHBOARD);
    },
    onError: (error) => {
      // REQ-X1 — la empresa ya existe (perfil completado antes en otra sesión/pestaña).
      if (error.code === 'ERR_EMPRESA_ALREADY_EXISTS') {
        clearSession();
        toast.error('Tu perfil ya fue completado anteriormente. Inicia sesión de nuevo.');
        navigate(ROUTES.LOGIN, { replace: true });
        return;
      }
      // REQ-X3/X5 — red/servidor/timeout: toast con el mensaje normalizado por el interceptor;
      // el wizard conserva sus valores porque viven en RHF (REQ-U9), no en este hook.
      if (!SILENCED_ERROR_CODES.has(error.code)) {
        toast.error(error.message || 'No se pudo completar tu registro. Intenta de nuevo.');
      }
    },
  });
}
