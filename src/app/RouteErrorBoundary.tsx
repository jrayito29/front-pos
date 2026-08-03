import { Component, type ReactNode } from 'react';
import { Button } from '../components/Button';

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

// SPEC-006 REQ-X1 — captura fallas de descarga del chunk de una ruta (import() dinámico) durante
// navegación, típicamente `Failed to fetch dynamically imported module` tras un deploy nuevo que
// invalida el hash de un chunk cacheado. En ese momento nada de la ruta destino se ha renderizado
// todavía, así que un fallback de pantalla completa con recarga total no oculta contenido funcional
// — es el único caso legítimo de full page reload en toda la SPA (se necesita para obtener el
// manifiesto de chunks actualizado). No debe usarse para errores de widgets dentro de una ruta ya
// montada (ver LazyWidget/WidgetErrorBoundary, REQ-U5/X2), que se aíslan localmente.
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
          <p className="text-sm text-foreground-secondary">
            No se pudo cargar la página. Esto puede deberse a una actualización reciente del sistema.
          </p>
          <Button variant="primary" onClick={this.handleReload}>
            Recargar
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
