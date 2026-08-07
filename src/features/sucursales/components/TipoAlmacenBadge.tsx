import { Badge } from '../../../components/Badge';
import { TIPO_ALMACEN, TIPO_ALMACEN_LABEL, type TipoAlmacenDomain } from '../constants/sucursal.constants';

const TONE: Record<TipoAlmacenDomain, 'green' | 'coral' | 'purple' | 'neutral'> = {
  [TIPO_ALMACEN.VENTAS]: 'green',
  [TIPO_ALMACEN.MERMAS]: 'coral',
  [TIPO_ALMACEN.TRANSITO]: 'purple',
  [TIPO_ALMACEN.RESERVA]: 'neutral',
  [TIPO_ALMACEN.APARTADOS]: 'purple',
  [TIPO_ALMACEN.PERSONALIZADO]: 'neutral',
};

export function TipoAlmacenBadge({ tipo }: { tipo: TipoAlmacenDomain }) {
  return <Badge tone={TONE[tipo]}>{TIPO_ALMACEN_LABEL[tipo]}</Badge>;
}
