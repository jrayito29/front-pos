// Espejo 1:1 de api-pos/src/constants/usuarios.constants.ts (SPEC-013, dominio admin). `superadmin`
// y `sysadmin` quedan fuera a propósito — no son asignables desde este módulo (usuarios-gestion.spec.md
// REQ-U7).
export const ROLES_ASIGNABLES = ['admin', 'gerente', 'almacenista', 'comprador', 'contador', 'rrhh', 'cajero'] as const;

export type RolAsignable = (typeof ROLES_ASIGNABLES)[number];

// Etiquetas en español para UsuarioRolBadge/UsuarioRolControl/UsuariosFiltrosContent — sin esto cada
// consumidor tendría que inventar su propia capitalización del valor crudo del backend.
export const USUARIO_ROL_LABEL: Record<RolAsignable, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  almacenista: 'Almacenista',
  comprador: 'Comprador',
  contador: 'Contador',
  rrhh: 'Recursos Humanos',
  cajero: 'Cajero',
};

export const USUARIO_ERRORS = {
  EMAIL_ALREADY_EXISTS: 'ERR_EMAIL_ALREADY_EXISTS',
  ROLE_INVALID: 'ERR_ROLE_INVALID',
  USER_NOT_FOUND: 'ERR_USER_NOT_FOUND',
  PERMISSION_DENIED: 'ERR_PERMISSION_DENIED',
  SELF_DEACTIVATION: 'ERR_USER_SELF_DEACTIVATION',
} as const;

// Códigos de negocio (409/422 sin `details` de Zod) mapeables a un campo visible de
// UsuarioFormModal — mismo criterio que CATEGORIA_ERROR_CODE_TO_FIELD/PRODUCTO_ERROR_CODE_TO_FIELD.
// ERR_USER_NOT_FOUND/ERR_PERMISSION_DENIED/ERR_USER_SELF_DEACTIVATION no aparecen aquí a propósito:
// no tienen un campo de formulario al que anclarse en ningún flujo de este módulo (SPEC-011 REQ-X5/X6).
export const USUARIO_ERROR_CODE_TO_FIELD: Record<string, string> = {
  [USUARIO_ERRORS.EMAIL_ALREADY_EXISTS]: 'email',
  [USUARIO_ERRORS.ROLE_INVALID]: 'role',
};
