import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Skeleton } from '../components/Skeleton';
import { Button } from '../components/Button';

interface LazyWidgetProps<P extends object> {
  loader: () => Promise<{ default: ComponentType<P> }>;
  label: string;
  fallback?: ReactNode;
  componentProps?: P;
}

type WidgetState<P extends object> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; Component: ComponentType<P> };

// SPEC-006 REQ-U5/X2 — split anidado para componentes pesados y visualmente aislados dentro de una
// ruta ya montada (ej. una gráfica de Recharts en un dashboard de reportes), aislado del
// Suspense/ErrorBoundary de nivel de ruta (RouteLoadingSkeleton/RouteErrorBoundary, REQ-U2/X1).
//
// Implementación deliberadamente SIN `React.lazy()`/`use()`/`Suspense` real, pese a que la spec
// habla de esos mecanismos como el patrón conceptual: `React.lazy()` no puede crearse dentro del
// cuerpo de render (bloqueado por la regla `react-hooks/static-components` del proyecto, pensada
// para el React Compiler) y recrearlo en cada reintento es la única forma de invalidar una promesa
// ya rechazada. La alternativa con `use()` (para poder crear la promesa fuera del render) entra en
// un loop de reintentos internos de React frente a una promesa rechazada dentro de un `Suspense`
// — reproducido de forma aislada en tests (timeout, ver historial de SPEC-006). El patrón manual de
// abajo (estado local + `useEffect`) dispara el mismo `import()` dinámico (mismo beneficio de code
// splitting), es determinista, y evita ambos problemas.
export function LazyWidget<P extends object>({ loader, label, fallback, componentProps }: LazyWidgetProps<P>) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<WidgetState<P>>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    loader()
      .then((mod) => {
        if (!cancelled) setState({ status: 'ready', Component: mod.default });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `attempt` es la señal deliberada de reintento; `loader` se asume estable por invocación de `LazyWidget`
  }, [attempt]);

  if (state.status === 'loading') {
    return <>{fallback ?? <Skeleton className="h-40 w-full" />}</>;
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-border bg-background-secondary p-4 text-center">
        <p className="text-sm text-foreground-secondary">No se pudo cargar {label}.</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            // Set síncrono en el handler de click (no dentro del efecto) para que el skeleton se
            // muestre de inmediato al reintentar, sin esperar a que el nuevo `import()` resuelva.
            setState({ status: 'loading' });
            setAttempt((n) => n + 1);
          }}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  const { Component } = state;
  return <Component {...(componentProps as P)} />;
}
