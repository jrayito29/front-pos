import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  // Ref del elemento que disparó la modal (ej. un botón "+"). Cuando se provee, la entrada nace
  // visualmente cerca de ese punto (scale + translate) en vez de crecer desde el centro puro —
  // refuerza la relación causa-efecto sin el costo/riesgo de un morph real (FLIP) entre formas muy
  // distintas (un botón pequeño vs. una modal ancha con formulario). Sin `originRef`, cae a un
  // scale+fade sutil centrado.
  originRef?: RefObject<HTMLElement | null>;
}

// La salida es más corta que la entrada (~70%, regla `exit-faster-than-enter`) — se siente más
// responsiva al cerrar que al abrir.
const ENTER_DURATION_MS = 200;
const EXIT_DURATION_MS = 140;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

// Componente genérico de overlay bloqueante — usado por cualquier confirmación destructiva o de
// alta consecuencia (CLAUDE.md §8 `confirmation-dialogs`) y por los modales de registro rápido
// (categoría/subcategoría). Sin lógica de negocio propia, el contenido/acciones vienen de `children`.
// El scrim (60% negro) aísla el contenido de fondo — regla `blur-purpose`/`scrim`.
export function Modal({ isOpen, title, onClose, children, originRef }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [offset, setOffset] = useState({ dx: 0, dy: 0 });
  const [wasOpen, setWasOpen] = useState(isOpen);
  // Sigue montado durante la animación de salida — `isOpen` ya es `false` pero el DOM permanece hasta
  // que la transición de cierre termina (ver el efecto de más abajo), o desaparecería de golpe.
  const [shouldRender, setShouldRender] = useState(isOpen);

  // Patrón "ajustar estado durante el render" (React docs, "You Might Not Need an Effect") en vez de
  // un efecto — evita un render extra y el lint `react-hooks/set-state-in-effect` (un `setState` que
  // solo deriva de un cambio de prop, sin tocar ningún sistema externo, no necesita vivir en un
  // efecto). `entered=false` en ambas ramas es intencional: en apertura reinicia el punto de partida
  // de la animación (el efecto de abajo la dispara de nuevo vía rAF); en cierre, ES la animación de
  // salida — el mismo flag que controla la entrada, revertido, anima de vuelta hacia el origen.
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    setEntered(false);
    if (isOpen) setShouldRender(true);
  }

  useFocusTrap(panelRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const trigger = originRef?.current;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      setOffset({
        dx: rect.left + rect.width / 2 - window.innerWidth / 2,
        dy: rect.top + rect.height / 2 - window.innerHeight / 2,
      });
    } else {
      setOffset({ dx: 0, dy: 0 });
    }
    // rAF: el navegador debe pintar el estado inicial (sin entrar) antes de aplicar la transición al
    // estado final, o la animación se salta directo al final (mismo criterio que emilkowalski).
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [isOpen, originRef]);

  // Desmonta recién cuando la transición de cierre terminó — nunca de golpe en cuanto `isOpen` pasa
  // a `false`.
  useEffect(() => {
    if (isOpen || !shouldRender) return;
    const timeout = setTimeout(() => setShouldRender(false), EXIT_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  const reducedMotion = prefersReducedMotion();
  const durationMs = isOpen ? ENTER_DURATION_MS : EXIT_DURATION_MS;
  const panelTransform = entered
    ? 'translate(0, 0) scale(1)'
    : reducedMotion
      ? 'translate(0, 0) scale(1)'
      : `translate(${offset.dx * 0.4}px, ${offset.dy * 0.4}px) scale(0.4)`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 transition-opacity ease-out"
        style={{ opacity: entered ? 1 : 0, transitionDuration: `${durationMs}ms` }}
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
        style={{ transform: panelTransform, opacity: entered ? 1 : 0, transitionDuration: `${durationMs}ms` }}
        className="relative z-10 w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-sm transition-[transform,opacity] ease-out"
      >
        <h2 id="modal-title" className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <div className="mt-3 text-sm text-foreground-secondary">{children}</div>
      </div>
    </div>
  );
}
