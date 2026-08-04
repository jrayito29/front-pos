import { useEffect, useState } from 'react';

// Compartido entre features — cualquier input de búsqueda que dispare una query server-side no
// debe hacerlo por cada tecla (SPEC-009 REQ-U12). Genérico: cualquier valor, no solo string.
export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
