import { Badge } from '../../../components/Badge';
import { ESTADO_CATEGORIA, ESTADO_CATEGORIA_LABEL, type EstadoCategoriaDomain } from '../constants/categoria.constants';

const TONE: Record<EstadoCategoriaDomain, 'green' | 'neutral'> = {
  [ESTADO_CATEGORIA.ACTIVO]: 'green',
  [ESTADO_CATEGORIA.INACTIVO]: 'neutral',
};

// Mirror EstadoBadge (features/productos) — combina color y texto siempre (regla `color-not-only`).
export function EstadoCategoriaBadge({ estado }: { estado: EstadoCategoriaDomain }) {
  return <Badge tone={TONE[estado]}>{ESTADO_CATEGORIA_LABEL[estado]}</Badge>;
}
