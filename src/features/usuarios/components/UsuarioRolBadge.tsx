import { Badge } from '../../../components/Badge';
import { USUARIO_ROL_LABEL, type RolAsignable } from '../constants/usuario.constants';

// A diferencia de EstadoCategoriaBadge/EstadoBadge, no representa un estado binario/multivalor de
// negocio — es una etiqueta de rol, un único tono para cualquier valor. Si `role` no pertenece a
// ROLES_ASIGNABLES (ej. "superadmin", que puede aparecer en su propio listado), se muestra el valor
// crudo sin traducir.
export function UsuarioRolBadge({ role }: { role: string }) {
  const label = USUARIO_ROL_LABEL[role as RolAsignable] ?? role;
  return <Badge tone="purple">{label}</Badge>;
}
