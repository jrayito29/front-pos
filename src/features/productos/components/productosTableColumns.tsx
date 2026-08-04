import type { TableColumn } from 'react-data-table-component';
import { TipoIcon } from './TipoIcon';
import { EstadoBadge } from './EstadoBadge';
import { TagChip } from './TagChip';
import { formatCurrency } from '../../../lib/formatCurrency';
import { tagNombrePorSlug } from '../constants/producto.constants';
import type { ProductoResumenDTO } from '../types/producto.types';

// SPEC-009 REQ-U14 — subconjunto de columnas del listado, nunca todos los campos de
// `ProductoResumenDTO`. `tipo` no es una columna propia: es el ícono prefijo del nombre.
export const productosTableColumns: TableColumn<ProductoResumenDTO>[] = [
  {
    name: 'Nombre',
    grow: 2,
    cell: (row) => (
      <div className="flex items-center gap-2 py-2">
        <TipoIcon tipo={row.tipo} />
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.nombreCorto}</span>
          {row.sku && <span className="text-xs text-foreground-secondary">{row.sku}</span>}
        </div>
      </div>
    ),
  },
  {
    name: 'Estado',
    cell: (row) => <EstadoBadge estado={row.estado} />,
  },
  {
    name: 'Precio',
    right: true,
    cell: (row) => <span className="tabular-nums">{formatCurrency(row.precioVenta)}</span>,
  },
  {
    name: 'Costo prom.',
    right: true,
    cell: (row) => <span className="tabular-nums">{formatCurrency(row.costoPromedio)}</span>,
  },
  {
    name: 'Tags',
    cell: (row) => (
      <div className="flex flex-wrap gap-1 py-1">
        {row.tags.map((tag) => (
          <TagChip key={tag.slug} nombre={tagNombrePorSlug(tag.slug)} color={tag.color} />
        ))}
      </div>
    ),
  },
];
