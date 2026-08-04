import { useRef, useState, type ReactNode } from 'react';
import { Button } from '../Button';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface FilterPopoverProps {
  activeCount: number;
  onApply: () => void;
  onClear: () => void;
  children: ReactNode;
}

// SPEC-009 REQ-U9 a U12 — shell genérico y sin conocimiento del dominio de los filtros: los campos
// (children) y su estado de borrador viven en el consumidor (CLAUDE.md §9, un componente de
// presentación no importa `services/`). Reutilizable por cualquier vista con DataTable, no exclusivo
// de Productos. "Aplicar"/"Limpiar" delegan al consumidor — este componente solo abre/cierra y
// atrapa el foco (REQ-U11).
export function FilterPopover({ activeCount, onApply, onClear, children }: FilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = () => setIsOpen(false);

  useOnClickOutside(panelRef, close, isOpen);
  useFocusTrap(panelRef, isOpen, () => triggerRef.current?.focus());

  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        Filtros
        {activeCount > 0 && (
          <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-green px-1.5 text-xs font-semibold text-white">
            {activeCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Filtros"
          className="absolute right-0 top-full z-20 mt-2 w-80 rounded-lg border border-border bg-background p-4 shadow-sm"
        >
          <div className="flex flex-col gap-4">{children}</div>
          <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onClear();
              }}
            >
              Limpiar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                onApply();
                close();
              }}
            >
              Aplicar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
