import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { preRegistro, verificarEmail } from '../services/auth.service';
import type { PreRegistroFormValues } from '../schemas/preRegistro.schema';
import type { LoginResponse } from '../types/auth.types';
import { useSessionStore } from '../../../stores/session.store';
import { ROUTES } from '../../../constants/routes';
import type { ApiError } from '../../../services/apiClient';

// SPEC-003 REQ-E1/E2 — encadena pre-registro -> verificar-email usando el token dev-only del backend.
// Fuera de alcance v1.1.0: si el campo no viene (backend en producción real), se trata como fallo de
// la secuencia (REQ-X4) — la pantalla "revisa tu correo" queda pendiente para cuando se active el email.
async function registrarYVerificar(values: PreRegistroFormValues): Promise<LoginResponse> {
  const { verificationTokenDevOnly } = await preRegistro(values);
  if (!verificationTokenDevOnly) {
    const error: ApiError = {
      code: 'ERR_VERIFICATION_TOKEN_MISSING',
      message: 'No se pudo completar tu registro, intenta de nuevo.',
    };
    throw error;
  }
  return verificarEmail(verificationTokenDevOnly);
}

// Único código mostrado inline junto al campo (REQ-X1); el resto se comunica vía toast (REQ-X2/X4).
const INLINE_ERROR_CODES = new Set(['ERR_EMAIL_ALREADY_EXISTS']);

export function usePreRegistro() {
  const navigate = useNavigate();
  const setOnboardingSession = useSessionStore((state) => state.setOnboardingSession);

  return useMutation<LoginResponse, ApiError, PreRegistroFormValues>({
    mutationFn: registrarYVerificar,
    onSuccess: (data) => {
      // REQ-E3 — siempre resuelve como LoginOnboardingResponse en este flujo (usuario recién creado,
      // perfilCompleto=false). Narrowing explícito porque LoginResponse es una unión discriminada
      // que TS no puede acotar sin comprobar 'perfilCompleto' primero (ver useLogin.ts).
      if ('perfilCompleto' in data && !data.perfilCompleto) {
        setOnboardingSession({
          onboardingToken: data.onboardingToken,
          refreshToken: data.refreshToken,
          usuarioId: data.usuarioId,
        });
        navigate(ROUTES.COMPLETAR_PERFIL);
        return;
      }
      toast.error('No se pudo completar tu registro, intenta de nuevo.');
    },
    onError: (error) => {
      if (!INLINE_ERROR_CODES.has(error.code)) {
        toast.error(error.message || 'No se pudo completar tu registro, intenta de nuevo.');
      }
    },
  });
}
