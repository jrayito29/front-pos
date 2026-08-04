import { useRef, type ReactNode } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

// Componente genérico de overlay bloqueante — usado por cualquier confirmación destructiva o de
// alta consecuencia (CLAUDE.md §8 `confirmation-dialogs`). SPEC-009 REQ-E10 (Discontinuado) y
// REQ-E11 (eliminar producto) lo consumen; sin lógica de negocio propia, el contenido/acciones vienen
// de `children`. El scrim (60% negro) aísla el contenido de fondo — regla `blur-purpose`/`scrim`.
export function Modal({ isOpen, title, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
        }}
        className="relative z-10 w-full max-w-md rounded-lg border border-border bg-background-secondary p-6 shadow-sm"
      >
        <h2 id="modal-title" className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <div className="mt-3 text-sm text-foreground-secondary">{children}</div>
      </div>
    </div>
  );
}
