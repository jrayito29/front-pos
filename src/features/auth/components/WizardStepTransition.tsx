import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';

interface PreviousStep {
  key: number;
  node: ReactNode;
}

const ENTER_MS = 220;
const EXIT_MS = 140;

// Mismo contrato de timing que AnimatedAuthOutlet (SPEC-002 REQ-S6/S7) — se reimplementa aquí en
// vez de reutilizar ese componente directamente porque AnimatedAuthOutlet está acoplado a
// react-router (useLocation/useOutlet) y el wizard cambia de "paso" en estado local, no de ruta
// (SPEC-004 REQ-S2). Ver AnimatedAuthOutlet.tsx para el razonamiento del doble rAF/`key`.
function useEnterSettle(): boolean {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setSettled(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  return settled;
}

function ExitingLayer({ node }: { node: ReactNode }) {
  const settled = useEnterSettle();
  return (
    <div
      className={`absolute inset-0 transition-opacity duration-[140ms] ease-out motion-reduce:duration-150 ${
        settled ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {node}
    </div>
  );
}

function EnteringLayer({ node, containerRef }: { node: ReactNode; containerRef: RefObject<HTMLDivElement | null> }) {
  const settled = useEnterSettle();
  return (
    <div
      ref={containerRef}
      className={`transition-[opacity,filter] duration-[220ms] ease-out-strong motion-reduce:transition-opacity motion-reduce:duration-150 motion-reduce:filter-none ${
        settled ? 'opacity-100 blur-none' : 'opacity-0 blur-sm'
      }`}
    >
      {node}
    </div>
  );
}

interface WizardStepTransitionProps {
  activeKey: number;
  children: ReactNode;
}

// SPEC-004 REQ-S2/E5 — crossfade 220ms entrada/140ms salida + blur, idéntico al contrato de
// SPEC-002, entre pasos del wizard. Tras completar la entrada, mueve el foco al primer campo del
// paso recién mostrado (REQ-E5, mismo patrón de accesibilidad que AnimatedAuthOutlet REQ-E9).
export function WizardStepTransition({ activeKey, children }: WizardStepTransitionProps) {
  const currentRef = useRef<HTMLDivElement>(null);
  const keyRef = useRef(activeKey);
  const lastChildrenRef = useRef(children);
  const isFirstRenderRef = useRef(true);
  const [previous, setPrevious] = useState<PreviousStep | null>(null);

  useEffect(() => {
    if (activeKey !== keyRef.current) {
      setPrevious({ key: keyRef.current, node: lastChildrenRef.current });
      keyRef.current = activeKey;
    }
    lastChildrenRef.current = children;
  }, [activeKey, children]);

  // Descarta el layer saliente tras EXIT_MS. Vive en su propio efecto (deps: `previous`) para no
  // compartir cleanup con el timeout de foco de abajo: si ambos vivieran en el mismo efecto, este
  // `setPrevious(null)` dispararía la re-ejecución del efecto y su cleanup cancelaría el timeout de
  // foco (220ms) antes de que llegara a dispararse, ya que EXIT_MS (140ms) < ENTER_MS (220ms).
  useEffect(() => {
    if (!previous) return;
    const dropTimeout = setTimeout(() => setPrevious(null), EXIT_MS);
    return () => clearTimeout(dropTimeout);
  }, [previous]);

  // REQ-E5 — mueve el foco al primer campo del paso entrante ENTER_MS después de cada cambio de
  // paso (no en el montaje inicial). Depende de `activeKey`, no de `previous`, precisamente para no
  // cancelarse cuando el efecto de arriba descarta el layer saliente (ver comentario anterior).
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    const focusTimeout = setTimeout(() => currentRef.current?.querySelector('input')?.focus(), ENTER_MS);
    return () => clearTimeout(focusTimeout);
  }, [activeKey]);

  return (
    <div className="relative w-full">
      {previous && <ExitingLayer key={`exit-${previous.key}`} node={previous.node} />}
      <EnteringLayer key={`enter-${activeKey}`} node={children} containerRef={currentRef} />
    </div>
  );
}
