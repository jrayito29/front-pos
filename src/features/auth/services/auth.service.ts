import { apiClient } from '../../../services/apiClient';
import type { LoginFormValues } from '../schemas/login.schema';
import type { PreRegistroFormValues } from '../schemas/preRegistro.schema';
import type { CompletarPerfilFormValues } from '../schemas/completarPerfil.schema';
import type { LoginResponse, PerfilCompletoResponse, PreRegistroResponse } from '../types/auth.types';

interface LoginApiResponse {
  success: true;
  data: LoginResponse;
}

export async function login(credentials: LoginFormValues): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginApiResponse>('/auth/login', credentials);
  return data.data;
}

interface PreRegistroApiResponse {
  success: true;
  data: PreRegistroResponse;
}

export async function preRegistro(payload: PreRegistroFormValues): Promise<PreRegistroResponse> {
  const { data } = await apiClient.post<PreRegistroApiResponse>('/auth/pre-registro', payload);
  return data.data;
}

interface VerificarEmailApiResponse {
  success: true;
  data: LoginResponse;
}

// El backend responde con la misma unión de LoginResponse (ver api-pos/src/services/auth.service.ts
// §verificarEmailService) — en el flujo de SPEC-003 siempre resuelve como LoginOnboardingResponse
// porque el usuario fue creado segundos antes (perfilCompleto=false).
export async function verificarEmail(token: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<VerificarEmailApiResponse>('/auth/verificar-email', { token });
  return data.data;
}

interface CompletarPerfilApiResponse {
  success: true;
  data: PerfilCompletoResponse;
}

// SPEC-004 REQ-E3 — el interceptor de request adjunta Authorization (onboardingToken) + x-usuario-id
// automáticamente (services/apiClient.ts), no se arma aquí.
export async function completarPerfil(payload: CompletarPerfilFormValues): Promise<PerfilCompletoResponse> {
  const { data } = await apiClient.post<CompletarPerfilApiResponse>('/auth/completar-perfil', payload);
  return data.data;
}
