import type { TableColumn } from 'react-data-table-component';
import { UsuarioRolBadge } from './UsuarioRolBadge';
import type { UsuarioListItemDTO } from '../types/usuario.types';

// Mirror categoriasTableColumns — `data-tag="allowRowEvents"` en cada celda custom para que el click
// de fila siga disparando la apertura del detalle. Columnas limitadas a lo que SPEC-011 REQ-U4
// permite: nombre completo, email, rol y fecha de alta — nunca más campos de UsuarioListItemDTO
// (que ya es, de por sí, un shape reducido sin `telefono`).
export const usuariosTableColumns: TableColumn<UsuarioListItemDTO>[] = [
  {
    name: 'Nombre',
    grow: 2,
    cell: (row) => (
      <span className="font-medium text-foreground" data-tag="allowRowEvents">
        {row.nombre} {row.apellidoPaterno}
        {row.apellidoMaterno ? ` ${row.apellidoMaterno}` : ''}
      </span>
    ),
  },
  {
    name: 'Email',
    grow: 2,
    cell: (row) => (
      <span className="text-foreground-secondary" data-tag="allowRowEvents">
        {row.email}
      </span>
    ),
  },
  {
    name: 'Rol',
    cell: (row) => (
      <span data-tag="allowRowEvents">
        <UsuarioRolBadge role={row.role} />
      </span>
    ),
  },
  {
    name: 'Alta',
    cell: (row) => (
      <span className="text-foreground-secondary" data-tag="allowRowEvents">
        {new Date(row.createdAt).toLocaleDateString('es-MX')}
      </span>
    ),
  },
];
