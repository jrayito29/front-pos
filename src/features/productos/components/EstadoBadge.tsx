import { Badge } from '../../../components/Badge';
import { ESTADO_PRODUCTO, type EstadoProductoDomain } from '../constants/producto.constants';

const ESTADO_CONFIG: Record<EstadoProductoDomain, { label: string; tone: 'green' | 'coral' | 'neutral' | 'purple' }> = {
  [ESTADO_PRODUCTO.BORRADOR]: { label: 'Borrador', tone: 'purple' },
  [ESTADO_PRODUCTO.ACTIVO]: { label: 'Activo', tone: 'green' },
  [ESTADO_PRODUCTO.INACTIVO]: { label: 'Inactivo', tone: 'neutral' },
  [ESTADO_PRODUCTO.DISCONTINUADO]: { label: 'Discontinuado', tone: 'coral' },
};

// SPEC-009 REQ-U16 — combina color y texto siempre (regla `color-not-only`), nunca solo un punto de color.
export function EstadoBadge({ estado }: { estado: EstadoProductoDomain }) {
  const { label, tone } = ESTADO_CONFIG[estado];
  return <Badge tone={tone}>{label}</Badge>;
}
