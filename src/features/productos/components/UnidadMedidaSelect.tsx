import { Select } from '../../../components/Select';
import { useUnidadesMedida, TIPO_UNIDAD_MEDIDA, type TipoUnidadMedidaDomain } from '../../unidades-medida';
import { TIPO_PRODUCTO, type TipoProductoDomain } from '../constants/producto.constants';

interface UnidadMedidaSelectProps {
  tipoProducto: TipoProductoDomain;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  error?: string;
}

// SPEC-016 v1.6.0 / RESPUESTA-007 — `unidadMedidaId` ya no es exclusivo de FISICO: filtra el catálogo
// de `GET /unidades-medida` por el `tipo` compatible (`FISICO`→`PRODUCTO`, `SERVICIO`→`SERVICIO`; el
// backend incluye siempre las de `tipo=AMBOS`, REQ-E2 SPEC-021). Sin botón "+" — a diferencia de
// CategoriaSelect, el catálogo es global y de solo lectura (SPEC-021 §DESIGN, sin endpoints de escritura).
const TIPO_UNIDAD_POR_TIPO_PRODUCTO: Record<TipoProductoDomain, TipoUnidadMedidaDomain> = {
  [TIPO_PRODUCTO.FISICO]: TIPO_UNIDAD_MEDIDA.PRODUCTO,
  [TIPO_PRODUCTO.SERVICIO]: TIPO_UNIDAD_MEDIDA.SERVICIO,
};

export function UnidadMedidaSelect({ tipoProducto, value, onChange, error }: UnidadMedidaSelectProps) {
  const { data: unidades, isLoading } = useUnidadesMedida({ tipo: TIPO_UNIDAD_POR_TIPO_PRODUCTO[tipoProducto] });
  const options = (unidades ?? []).map((unidad) => ({ value: unidad.id, label: unidad.nombre }));

  return (
    <Select
      label="Unidad de medida"
      options={options}
      value={value}
      onChange={onChange}
      error={error}
      isClearable
      isDisabled={isLoading}
      placeholder="Selecciona una unidad"
    />
  );
}
