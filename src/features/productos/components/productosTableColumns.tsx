import type { TableColumn } from 'react-data-table-component';
import { TipoIcon } from './TipoIcon';
import { EstadoBadge } from './EstadoBadge';
import { TagChip } from './TagChip';
import { formatCurrency } from '../../../lib/formatCurrency';
import { tagNombrePorSlug } from '../constants/producto.constants';
import type { ProductoResumenDTO } from '../types/producto.types';

// SPEC-009 REQ-U14 — subconjunto de columnas del listado, nunca todos los campos de
// `ProductoResumenDTO`. `tipo` no es una columna propia: es el ícono prefijo del nombre.
//
// `data-tag="allowRowEvents"` en el wrapper de cada celda: react-data-table-component solo dispara
// `onRowClicked` para clics dentro de un elemento con ese atributo cuando la celda usa un `cell`
// custom — sin él, el click únicamente funciona sobre el padding nativo de la librería (el "espacio
// vacío" entre nuestro contenido y el borde de la celda), nunca sobre el contenido que renderizamos.
export const productosTableColumns: TableColumn<ProductoResumenDTO>[] = [
  {
    name: 'Nombre',
    grow: 2,
    cell: (row) => (
      <div className="flex items-center gap-2 py-2" data-tag="allowRowEvents">
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
    cell: (row) => (
      <span data-tag="allowRowEvents">
        <EstadoBadge estado={row.estado} />
      </span>
    ),
  },
  {
    name: 'Precio',
    right: true,
    cell: (row) => (
      <span className="tabular-nums" data-tag="allowRowEvents">
        {formatCurrency(row.precioVenta)}
      </span>
    ),
  },
  {
    name: 'Costo prom.',
    right: true,
    cell: (row) => (
      <span className="tabular-nums" data-tag="allowRowEvents">
        {formatCurrency(row.costoPromedio)}
      </span>
    ),
  },
  {
    name: 'Tags',
    cell: (row) => (
      <div className="flex flex-wrap gap-1 py-1" data-tag="allowRowEvents">
        {row.tags.map((tag) => (
          <TagChip key={tag.slug} nombre={tagNombrePorSlug(tag.slug)} color={tag.color} />
        ))}
      </div>
    ),
  },
];
