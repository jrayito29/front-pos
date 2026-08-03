import { useEffect, useState } from 'react';
import { useSessionStore } from '../stores/session.store';

// SPEC-004 REQ-S5 (adenda v1.1.0) — el estado inicial ya considera `hasHydrated()` por si la
// rehidratación de sessionStorage terminó antes del primer render (montajes subsecuentes en la
// misma sesión de pestaña); `onFinishHydration` cubre el caso de un F5 donde la rehidratación aún
// está en curso durante el primer render. Compartido entre `RequireOnboarding` (SPEC-004) y
// `RequireAuth` (SPEC-005 REQ-U4) — ambos guards dependen de que `persist` termine de leer
// sessionStorage antes de decidir un redirect.
export function useSessionHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useSessionStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return;
    return useSessionStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  return hydrated;
}
