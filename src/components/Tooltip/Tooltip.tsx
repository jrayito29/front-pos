import { useRef, useState, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

// Delay antes de aparecer (evita activación accidental al pasar el cursor de paso); el cierre es
// instantáneo — mismo criterio asimétrico que Modal (salida más rápida que la entrada).
const OPEN_DELAY_MS = 400;
const TRANSITION_MS = 125;

// Tooltip genérico — el trigger vive tal cual en `children` (nunca `disabled`, para que reciba foco y
// hover normalmente); los handlers se atan al `<span>` contenedor, no al hijo, así funciona con
// cualquier elemento sin necesitar forwardRef. `onFocus`/`onBlur` de React burbujean (delegación
// sintética vía focusin/focusout), por eso alcanza con los del wrapper.
export function Tooltip({ content, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  function show() {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
  }

  function hide() {
    window.clearTimeout(timeoutRef.current);
    setOpen(false);
  }

  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-sm transition-[opacity,transform] ease-out"
        style={{
          opacity: open ? 1 : 0,
          transform: `translateX(-50%) scale(${open ? 1 : 0.97})`,
          transitionDuration: `${TRANSITION_MS}ms`,
          visibility: open ? 'visible' : 'hidden',
        }}
      >
        {content}
      </span>
    </span>
  );
}
