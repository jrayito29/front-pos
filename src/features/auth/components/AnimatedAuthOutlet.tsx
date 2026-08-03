import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useLocation, useOutlet } from 'react-router';

interface PreviousRoute {
  key: string;
  node: ReactNode;
}

const ENTER_MS = 220;
const EXIT_MS = 140;

// Arranca en `settled=false` por el estado inicial del hook y solo pasa a `true` dentro de un doble
// rAF diferido (equivalente a @starting-style, ver emil-design-eng) — nunca hay un setState síncrono
// en el cuerpo del efecto. Montar el layer con una `key` nueva por transición reinicia el estado
// automáticamente (patrón de React para "resetear estado al cambiar una prop"), sin leer/escribir refs
// durante el render.
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

// SPEC-002 REQ-S6/S7/E9 — crossfade entre los modos `login`/`registro` del panel compartido con
// SPEC-003. El contenido saliente se superpone en `absolute` mientras se desvanece (140ms); el
// entrante define la altura del contenedor de inmediato y anima opacidad+blur por separado (220ms) —
// nunca se anima `height`/`width`. CSS transitions, no `@keyframes`, para permanecer interrumpible si
// el usuario alterna rápido. `motion-reduce:` sustituye el crossfade por un fade simple sin blur.
export function AnimatedAuthOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const currentRef = useRef<HTMLDivElement>(null);
  const pathnameRef = useRef(location.pathname);
  const lastOutletRef = useRef(outlet);
  const isFirstRenderRef = useRef(true);

  const [previous, setPrevious] = useState<PreviousRoute | null>(null);

  useEffect(() => {
    if (location.pathname !== pathnameRef.current) {
      setPrevious({ key: pathnameRef.current, node: lastOutletRef.current });
      pathnameRef.current = location.pathname;
    }
    lastOutletRef.current = outlet;
  }, [location.pathname, outlet]);

  // Descarta el layer saliente tras EXIT_MS. Vive en su propio efecto (deps: `previous`) para no
  // compartir cleanup con el timeout de foco de abajo: si ambos vivieran en el mismo efecto, este
  // `setPrevious(null)` dispararía la re-ejecución del efecto y su cleanup cancelaría el timeout de
  // foco (220ms) antes de que llegara a dispararse, ya que EXIT_MS (140ms) < ENTER_MS (220ms) — el
  // foco nunca se movía en la práctica (bug detectado al escribir los tests de SPEC-004 REQ-E5,
  // que reimplementa este mismo contrato para el wizard de completar perfil).
  useEffect(() => {
    if (!previous) return;
    const dropTimeout = setTimeout(() => setPrevious(null), EXIT_MS);
    return () => clearTimeout(dropTimeout);
  }, [previous]);

  // REQ-E9 — mueve el foco al primer campo del formulario recién mostrado ENTER_MS después de cada
  // cambio de ruta (no en el montaje inicial). Depende de `location.pathname`, no de `previous`,
  // precisamente para no cancelarse cuando el efecto de arriba descarta el layer saliente.
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    const focusTimeout = setTimeout(() => currentRef.current?.querySelector('input')?.focus(), ENTER_MS);
    return () => clearTimeout(focusTimeout);
  }, [location.pathname]);

  return (
    <div className="relative w-full">
      {previous && <ExitingLayer key={`exit-${previous.key}`} node={previous.node} />}
      <EnteringLayer key={`enter-${location.pathname}`} node={outlet} containerRef={currentRef} />
    </div>
  );
}
