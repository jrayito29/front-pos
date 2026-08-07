import type { TableColumn } from 'react-data-table-component';
import { EstadoActivoBadge } from './EstadoActivoBadge';
import type { SucursalDTO } from '../types/sucursal.types';

// SPEC-012 REQ-U3 — subconjunto de columnas del listado, nunca todos los campos de `SucursalDTO`
// (que sí incluye teléfono/email/dirección completa — visibles solo en el detalle).
export const sucursalesTableColumns: TableColumn<SucursalDTO>[] = [
  {
    name: 'Nombre',
    grow: 2,
    cell: (row) => (
      <span className="font-medium text-foreground" data-tag="allowRowEvents">
        {row.nombre}
      </span>
    ),
  },
  {
    name: 'Código',
    cell: (row) => (
      <span className="text-sm text-foreground-secondary" data-tag="allowRowEvents">
        {row.codigoPersonalizable ?? row.codigoInterno}
      </span>
    ),
  },
  {
    name: 'Ubicación',
    grow: 1.5,
    cell: (row) => (
      <span className="text-sm text-foreground-secondary" data-tag="allowRowEvents">
        {row.municipio}, {row.estado}
      </span>
    ),
  },
  {
    name: 'Estado',
    cell: (row) => (
      <span data-tag="allowRowEvents">
        <EstadoActivoBadge activo={row.activo} />
      </span>
    ),
  },
];
