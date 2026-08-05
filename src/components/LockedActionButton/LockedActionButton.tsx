import { forwardRef } from 'react';
import { Button } from '../Button';
import { Tooltip } from '../Tooltip';
import { LockIcon } from '../icons';

interface LockedActionButtonProps {
  // Explica la razón del bloqueo — nunca "Acción no disponible" genérico (CLAUDE.md §8).
  reason: string;
  onRequestAccess: () => void;
  size?: 'sm' | 'md' | 'lg';
  // Contextos angostos (ej. columna de acciones de un DataTable) donde el label "Bloqueado" no cabe —
  // el ícono + Tooltip ya comunican la acción, mismo criterio que el botón "Eliminar" icon-only de esa
  // misma columna.
  iconOnly?: boolean;
}

// Reemplaza a un botón de acción oculto cuando el usuario puede VER la pantalla pero no tiene el
// permiso de esa acción puntual — `ui-ux-pro-max` (`empty-nav-state`): explicar por qué algo no está
// disponible en vez de ocultarlo en silencio. Deliberadamente NO usa el atributo `disabled`: sigue
// siendo un botón enfocable/clickeable, solo que su acción es abrir la solicitud de acceso en vez de
// la acción original — así el tooltip funciona por teclado sin necesitar `aria-disabled` (regla
// `tooltip-keyboard`). Reenvía el `ref` al `<button>` real para que `SolicitarAccesoModal` (`Modal`
// con `originRef`) pueda nacer visualmente desde este botón, igual que desde su contraparte habilitada.
export const LockedActionButton = forwardRef<HTMLButtonElement, LockedActionButtonProps>(
  ({ reason, onRequestAccess, size = 'sm', iconOnly = false }, ref) => {
    return (
      <Tooltip content={reason}>
        <Button ref={ref} type="button" variant="secondary" size={size} onClick={onRequestAccess} aria-label={reason}>
          <LockIcon className="h-4 w-4" />
          {!iconOnly && 'Bloqueado'}
        </Button>
      </Tooltip>
    );
  }
);

LockedActionButton.displayName = 'LockedActionButton';
