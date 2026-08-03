// Respuesta de GET /auth/perfil (self-service, mismo criterio de auto-referencia que
// GET /auth/permisos — usuarioId/empresaId resueltos del token, sin verificarRole).
// Ref: RESPUESTA-003-datos-usuario-y-logo-empresa.md
export interface PerfilUsuarioResponse {
  // `null` explícito cuando el usuario no tiene `PerfilUsuario` en backend — nunca inventar un
  // nombre a partir del email (mismo principio que SPEC-008 REQ-X3).
  nombre: string | null;
  empresa: {
    nombre: string;
    // Siempre `null` por ahora — el backend no tiene mecanismo de subida de archivos todavía
    // (Fase 2 diferida, ver esa misma respuesta). El campo ya existe en el contrato para no
    // requerir un segundo cambio de tipos cuando se implemente.
    logoUrl: string | null;
  };
}
