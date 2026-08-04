import { Skeleton } from '../Skeleton';

interface TableRowsSkeletonProps {
  columnCount: number;
  rowCount?: number;
}

// SPEC-009 REQ-S1 — usado como `progressComponent` de react-data-table-component: filas de Skeleton
// en vez de un spinner genérico (CLAUDE.md §8). `columnCount` refleja las columnas reales que la
// feature consumidora declaró (REQ-U5), para que el placeholder tenga la misma forma que los datos.
export function TableRowsSkeleton({ columnCount, rowCount = 6 }: TableRowsSkeletonProps) {
  return (
    <div className="w-full" role="status" aria-busy="true" aria-label="Cargando datos">
      {Array.from({ length: rowCount }, (_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-4 border-b border-border px-4 py-3.5"
          style={{ minHeight: '56px' }}
        >
          {Array.from({ length: columnCount }, (_, colIndex) => (
            <Skeleton key={colIndex} variant="text" className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
