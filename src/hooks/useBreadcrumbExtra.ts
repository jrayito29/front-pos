import { useEffect } from 'react';
import { useBreadcrumbStore } from '../stores/breadcrumb.store';

// Registra el segundo nivel del breadcrumb (ej. "Nuevo producto", o el nombre de una entidad ya
// cargada) mientras el componente que lo llama está montado, y lo limpia automáticamente al
// desmontar — así el nivel no persiste al navegar a una vista sin segundo nivel (ej. volver al
// listado). `label` en `undefined`/`null` no registra nada (útil mientras el dato real todavía carga).
export function useBreadcrumbExtra(label: string | null | undefined) {
  const setExtra = useBreadcrumbStore((state) => state.setExtra);
  useEffect(() => {
    setExtra(label ?? null);
    return () => setExtra(null);
  }, [label, setExtra]);
}
