import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Compartido entre cualquier overlay (popover, modal) que deba atrapar el foco mientras esté abierto
// y devolverlo al elemento que lo disparó al cerrarse (regla `keyboard-nav`/`escape-routes`,
// ui-ux-pro-max). SPEC-009 REQ-U11 (popover de filtros) y modales de confirmación.
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean, onReturnFocus?: () => void) {
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

    focusables()[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;
      const elements = focusables();
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (onReturnFocus) {
        onReturnFocus();
      } else {
        previouslyFocused?.focus();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo re-ejecuta al abrir/cerrar (`active`); `containerRef`/`onReturnFocus` se asumen estables por invocación
  }, [active]);
}
