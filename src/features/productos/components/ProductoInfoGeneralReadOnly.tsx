import { TIPO_PRODUCTO } from '../constants/producto.constants';
import type { ProductoDTO } from '../types/producto.types';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-foreground-secondary">{label}</span>
      <span className="text-sm text-foreground">{value || '—'}</span>
    </div>
  );
}

// SPEC-009 REQ-U25 — modo lectura: texto plano, nunca inputs deshabilitados (regla `read-only-distinction`).
export function ProductoInfoGeneralReadOnly({ producto }: { producto: ProductoDTO }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="SKU" value={producto.sku ?? ''} />
      {producto.tipo === TIPO_PRODUCTO.FISICO && <Field label="Código de barras" value={producto.codigoBarras ?? ''} />}
      <Field label="Nombre corto" value={producto.nombreCorto} />
      <Field label="Nombre largo" value={producto.nombreLargo} />
      <Field label="Unidad de medida" value={producto.unidadMedida?.nombre ?? ''} />
      {producto.tipo === TIPO_PRODUCTO.FISICO && <Field label="Requiere báscula" value={producto.requiereBascula ? 'Sí' : 'No'} />}
    </div>
  );
}
