import { useEffect, type RefObject } from 'react';

// Compartido entre features — cualquier panel tipo dropdown/popover que deba cerrarse al hacer
// click fuera o presionar Escape. Usado por AppLayout (SPEC-008 REQ-E4, notificaciones).
export function useOnClickOutside(ref: RefObject<HTMLElement | null>, onOutside: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function handlePointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutside();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onOutside();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, onOutside, enabled]);
}
