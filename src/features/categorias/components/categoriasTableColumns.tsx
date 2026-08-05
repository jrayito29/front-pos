import type { TableColumn } from 'react-data-table-component';
import { Badge } from '../../../components/Badge';
import { EstadoCategoriaBadge } from './EstadoCategoriaBadge';
import type { CategoriaResumenDTO } from '../types/categoria.types';

// Mirror productosTableColumns (features/productos) — `data-tag="allowRowEvents"` en cada celda
// custom para que el click de fila (react-data-table-component) siga funcionando sobre el contenido.
// Sin columna "Categoría padre": GET /categorias (listado) no trae el nombre del padre, solo
// `padreId` — el filtro "Categoría padre" (CategoriasFiltrosContent) cubre esa navegación.
export const categoriasTableColumns: TableColumn<CategoriaResumenDTO>[] = [
  {
    name: 'Nombre',
    grow: 2,
    cell: (row) => (
      <span className={`font-medium text-foreground ${row.padreId ? 'pl-4' : ''}`} data-tag="allowRowEvents">
        {row.padreId && <span className="text-foreground-muted">↳ </span>}
        {row.nombre}
      </span>
    ),
  },
  {
    name: 'Jerarquía',
    cell: (row) => (
      <span data-tag="allowRowEvents">
        <Badge tone={row.padreId ? 'purple' : 'neutral'}>{row.padreId ? 'Subcategoría' : 'Raíz'}</Badge>
      </span>
    ),
  },
  {
    name: 'Estado',
    cell: (row) => (
      <span data-tag="allowRowEvents">
        <EstadoCategoriaBadge estado={row.estado} />
      </span>
    ),
  },
];
