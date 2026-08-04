import { useId, type ReactNode } from 'react';

interface DataTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchLabel: string;
  searchPlaceholder?: string;
  filterPopover?: ReactNode;
  primaryAction?: ReactNode;
}

// SPEC-009 REQ-U9 — patrón de toolbar compartido por cualquier vista con `DataTable`: buscador
// siempre visible + slot para el popover de filtros (REQ-U9 a U12) + acción primaria de la vista.
// Etiqueta del buscador visualmente oculta (`sr-only`, no placeholder-only) para cumplir accesibilidad
// sin ocupar el espacio vertical de un label apilado en una barra de una sola fila.
export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchLabel,
  searchPlaceholder = 'Buscar...',
  filterPopover,
  primaryAction,
}: DataTableToolbarProps) {
  const searchId = useId();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <label htmlFor={searchId} className="sr-only">
            {searchLabel}
          </label>
          <input
            id={searchId}
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-56 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          />
        </div>
        {filterPopover}
      </div>
      {primaryAction}
    </div>
  );
}
