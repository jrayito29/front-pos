import { Badge } from '../../../components/Badge';

// Mirror EstadoCategoriaBadge/EstadoBadge (features/categorias, features/productos) — combina color
// y texto siempre (regla `color-not-only`). Compartido por Sucursal y Almacén: ambos modelan el
// estado como `activo: boolean`, no como enum (SPEC-012 REQ-U3 — no confundir con el campo de
// dirección `estado`, entidad federativa).
export function EstadoActivoBadge({ activo }: { activo: boolean }) {
  return <Badge tone={activo ? 'green' : 'neutral'}>{activo ? 'Activo' : 'Inactivo'}</Badge>;
}
