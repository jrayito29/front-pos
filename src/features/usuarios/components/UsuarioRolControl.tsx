import { useState } from 'react';
import { toast } from 'sonner';
import { Select } from '../../../components/Select';
import { UsuarioRolBadge } from './UsuarioRolBadge';
import { useCambiarRolUsuario } from '../hooks/useCambiarRolUsuario';
import { ROLES_ASIGNABLES, USUARIO_ERRORS, USUARIO_ROL_LABEL, type RolAsignable } from '../constants/usuario.constants';

interface UsuarioRolControlProps {
  usuarioId: string;
  role: string;
}

const ROL_OPTIONS = ROLES_ASIGNABLES.map((value) => ({ value, label: USUARIO_ROL_LABEL[value] }));

function esRolAsignable(role: string): role is RolAsignable {
  return (ROLES_ASIGNABLES as readonly string[]).includes(role);
}

// SPEC-011 REQ-U6 — `Select` con las 7 opciones de ROLES_ASIGNABLES, a diferencia de
// CategoriaEstadoControl (`Switch`, binario): mismo criterio que distinguió ProductoEstadoControl
// (>2 estados). El cambio aplica al instante (sin modal de confirmación, REQ-E3) — a diferencia de
// CategoriaEstadoControl/ProductoEstadoControl, ningún cambio de rol de este catálogo tiene una
// transición de mayor consecuencia que justifique confirmarla. Si el rol actual de la fila no
// pertenece a ROLES_ASIGNABLES (el propio superadmin puede aparecer en su propio listado, ver
// UsuarioDetalleModal), se muestra como badge de solo lectura: reasignarle un rol de este catálogo a
// un superadmin no es un flujo que este control deba ofrecer.
export function UsuarioRolControl({ usuarioId, role }: UsuarioRolControlProps) {
  const [error, setError] = useState<string>();
  const cambiarRol = useCambiarRolUsuario();

  if (!esRolAsignable(role)) {
    return <UsuarioRolBadge role={role} />;
  }

  function handleChange(value: string | undefined) {
    if (!value || value === role) return;
    setError(undefined);
    cambiarRol.mutate(
      { id: usuarioId, role: value as RolAsignable },
      {
        onSuccess: () => toast.success('Rol actualizado'),
        onError: (apiError) => {
          // SPEC-011 REQ-X5 — ERR_ROLE_INVALID se ancla al propio control; el resto (ERR_USER_NOT_FOUND,
          // ERR_PERMISSION_DENIED — la fila pudo desactivarse desde otra sesión) no tiene campo al que
          // anclarse en este contexto y se muestra vía toast.
          if (apiError.code === USUARIO_ERRORS.ROLE_INVALID) {
            setError(apiError.message);
          } else {
            toast.error(apiError.message);
          }
        },
      }
    );
  }

  return (
    <div className="w-48">
      <Select
        label="Rol"
        hideLabel
        options={ROL_OPTIONS}
        value={role}
        onChange={handleChange}
        isDisabled={cambiarRol.isPending}
        error={error}
      />
    </div>
  );
}
