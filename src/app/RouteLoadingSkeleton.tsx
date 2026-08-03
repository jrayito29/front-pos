import { Skeleton } from '../components/Skeleton';

// SPEC-006 REQ-U2/S1 — fallback de `Suspense` a nivel de ruta mientras se descarga el chunk lazy
// (REQ-U1). No representa el layout final de ninguna ruta específica (el árbol de <Routes> cubre
// vistas muy distintas entre sí — login, wizard, dashboard) y sirve solo para el primer paint antes
// de resolver a qué ruta se navegó; nunca un spinner genérico (CLAUDE.md §8).
export function RouteLoadingSkeleton() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-background px-6"
      role="status"
      aria-busy="true"
      aria-label="Cargando"
    >
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  );
}
