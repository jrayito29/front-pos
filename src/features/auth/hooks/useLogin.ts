import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { login } from '../services/auth.service';
import type { LoginFormValues } from '../schemas/login.schema';
import type { LoginResponse } from '../types/auth.types';
import { useSessionStore } from '../../../stores/session.store';
import { ROUTES } from '../../../constants/routes';
import type { ApiError } from '../../../services/apiClient';

// Códigos que la vista muestra inline junto al formulario — nunca como toast (SPEC-002 REQ-X1/X5/X6/X7)
const INLINE_ERROR_CODES = new Set([
  'ERR_INVALID_CREDENTIALS',
  'ERR_ACCOUNT_LOCKED',
  'ERR_SUBSCRIPTION_EXPIRED',
  'ERR_EMAIL_NOT_VERIFIED',
]);

export function useLogin() {
  const navigate = useNavigate();
  const setTenantSession = useSessionStore((state) => state.setTenantSession);
  const setOnboardingSession = useSessionStore((state) => state.setOnboardingSession);

  return useMutation<LoginResponse, ApiError, LoginFormValues>({
    mutationFn: login,
    onSuccess: (data) => {
      // LoginSysAdminResponse no trae `perfilCompleto` — REQ-E7
      if (!('perfilCompleto' in data)) {
        setTenantSession({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        navigate(ROUTES.SYSADMIN);
        return;
      }

      // LoginOnboardingResponse — REQ-E6
      if (!data.perfilCompleto) {
        setOnboardingSession({
          onboardingToken: data.onboardingToken,
          refreshToken: data.refreshToken,
          usuarioId: data.usuarioId,
        });
        navigate(ROUTES.COMPLETAR_PERFIL);
        return;
      }

      // LoginTenantResponse — REQ-E3. mustChangePassword/requiereSeleccionSucursal ya no redirigen a
      // una ruta propia: quedan como banderas en el store y RequireAuth las renderiza como modal
      // bloqueante sobre el dashboard (REQ-S5/E5).
      setTenantSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        mustChangePassword: data.mustChangePassword,
        requiereSeleccionSucursal: data.requiereSeleccionSucursal,
      });

      if (data.sessionConflict) {
        toast.info('Había una sesión activa en otro dispositivo.');
      }
      if (data.subscriptionEnGracia) {
        toast.warning('Tu suscripción está en período de gracia.');
      }

      navigate(ROUTES.DASHBOARD);
    },
    onError: (error) => {
      if (!INLINE_ERROR_CODES.has(error.code)) {
        toast.error(error.message || 'No se pudo iniciar sesión. Intenta de nuevo.');
      }
    },
  });
}
