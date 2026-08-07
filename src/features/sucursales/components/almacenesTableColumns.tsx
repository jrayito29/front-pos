import type { TableColumn } from 'react-data-table-component';
import { TipoAlmacenBadge } from './TipoAlmacenBadge';
import { EstadoActivoBadge } from './EstadoActivoBadge';
import type { AlmacenDTO } from '../types/sucursal.types';

function configuracionLabel(almacen: AlmacenDTO): string {
  const flags = [
    almacen.permitirVenta && 'Venta',
    almacen.permitirTraspaso && 'Traspaso',
    almacen.esVirtual && 'Virtual',
  ].filter(Boolean);
  return flags.length > 0 ? flags.join(' · ') : '—';
}

// SPEC-012 REQ-U7 — columnas de la tabla de la tab Almacenes. `Configuración` resume los 3 flags
// booleanos en texto (nunca solo color, regla `color-not-only`).
export const almacenesTableColumns: TableColumn<AlmacenDTO>[] = [
  {
    name: 'Nombre',
    grow: 2,
    cell: (row) => (
      <div className="flex flex-col py-2" data-tag="allowRowEvents">
        <span className="font-medium text-foreground">{row.nombre}</span>
        <span className="text-xs text-foreground-secondary">{row.codigoPersonalizable ?? row.codigoInterno}</span>
      </div>
    ),
  },
  {
    name: 'Tipo',
    cell: (row) => (
      <span data-tag="allowRowEvents">
        <TipoAlmacenBadge tipo={row.tipo} />
      </span>
    ),
  },
  {
    name: 'Configuración',
    cell: (row) => (
      <span className="text-sm text-foreground-secondary" data-tag="allowRowEvents">
        {configuracionLabel(row)}
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
