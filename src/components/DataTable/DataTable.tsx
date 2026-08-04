import { type ReactNode } from 'react';
import RDTDataTable, { type TableColumn } from 'react-data-table-component';
import { dataTableStyles } from './tableStyles';
import { TableRowsSkeleton } from './TableRowsSkeleton';

export interface DataTablePaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyField?: keyof T & string;
  isLoading?: boolean;
  emptyState: ReactNode;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  pagination: DataTablePaginationProps;
}

// SPEC-009 REQ-U1 a U8 — componente genérico y reutilizable por cualquier feature con listado
// tabular (no exclusivo de Productos). Sin lógica de negocio ni imports de `services/` (CLAUDE.md
// §9): todo entra vía props. El estado de error (REQ-X1) es responsabilidad de la vista consumidora
// — este componente no lo modela, así que no debe renderizarse cuando la query falla.
export function DataTable<T>({
  columns,
  data,
  keyField,
  isLoading = false,
  emptyState,
  onRowClick,
  rowActions,
  pagination,
}: DataTableProps<T>) {
  // REQ-U6 — columna de acciones opcional, `ignoreRowClick` evita que dispare la navegación de fila
  // (REQ-U18) sin necesitar `stopPropagation` manual: es soporte nativo de la librería para esto.
  const resolvedColumns: TableColumn<T>[] = rowActions
    ? [
        ...columns,
        {
          name: '',
          cell: (row) => rowActions(row),
          ignoreRowClick: true,
          width: '56px',
          right: true,
        },
      ]
    : columns;

  return (
    <RDTDataTable
      columns={resolvedColumns}
      data={data}
      keyField={keyField}
      customStyles={dataTableStyles}
      responsive
      highlightOnHover
      pointerOnHover={Boolean(onRowClick)}
      onRowClicked={onRowClick}
      progressPending={isLoading}
      progressComponent={<TableRowsSkeleton columnCount={resolvedColumns.length} />}
      noDataComponent={<div className="w-full py-2">{emptyState}</div>}
      pagination
      paginationServer
      paginationTotalRows={pagination.total}
      paginationPage={pagination.page}
      paginationPerPage={pagination.limit}
      paginationRowsPerPageOptions={[10, 20, 50, 100]}
      paginationComponentOptions={{ rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de' }}
      onChangePage={pagination.onPageChange}
      onChangeRowsPerPage={pagination.onLimitChange}
    />
  );
}
