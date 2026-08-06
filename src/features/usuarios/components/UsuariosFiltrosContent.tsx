import { Select } from '../../../components/Select';
import { ROLES_ASIGNABLES, USUARIO_ROL_LABEL, type RolAsignable } from '../constants/usuario.constants';

export interface UsuariosFiltrosDraft {
  role?: RolAsignable;
}

const ROL_OPTIONS = ROLES_ASIGNABLES.map((value) => ({ value, label: USUARIO_ROL_LABEL[value] }));

interface UsuariosFiltrosContentProps {
  draft: UsuariosFiltrosDraft;
  onChange: (next: UsuariosFiltrosDraft) => void;
}

// Mirror CategoriasFiltrosContent — puramente controlado, el borrador vive en UsuariosListPage.
export function UsuariosFiltrosContent({ draft, onChange }: UsuariosFiltrosContentProps) {
  return (
    <Select
      label="Rol"
      placeholder="Todos"
      isClearable
      options={ROL_OPTIONS}
      value={draft.role}
      onChange={(value) => onChange({ ...draft, role: value as RolAsignable | undefined })}
    />
  );
}
