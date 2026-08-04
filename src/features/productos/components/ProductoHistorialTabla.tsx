import { formatCurrency } from '../../../lib/formatCurrency';
import { FUENTE_PRECIO } from '../constants/producto.constants';
import type { HistorialPrecioDTO } from '../types/producto.types';

function TendenciaFecha({ entrada }: { entrada: HistorialPrecioDTO }) {
  const subio = Number(entrada.precioVentaNuevo) > Number(entrada.precioVentaAnterior);
  const bajo = Number(entrada.precioVentaNuevo) < Number(entrada.precioVentaAnterior);
  const fecha = new Date(entrada.creadoEn).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

  // REQ-U32 — el color nunca es el único indicador (regla `color-not-only`): el triángulo ▲/▼
  // acompaña siempre al color, nunca aparece solo.
  return (
    <span className={`inline-flex items-center gap-1 ${subio ? 'text-brand-green-text' : bajo ? 'text-brand-coral-text' : 'text-foreground-secondary'}`}>
      {subio && '▲'}
      {bajo && '▼'}
      {fecha}
    </span>
  );
}

const FUENTE_LABEL: Record<string, string> = {
  [FUENTE_PRECIO.AJUSTE_MANUAL]: 'Ajuste manual',
  [FUENTE_PRECIO.ORDEN_COMPRA]: 'Orden de compra',
};

// SPEC-009 REQ-U32 — alternativa accesible a la gráfica (regla `data-table`, ui-ux-pro-max §chart).
export function ProductoHistorialTabla({ historial }: { historial: HistorialPrecioDTO[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-semibold text-foreground-secondary">
            <th className="py-2 pr-4">Fecha</th>
            <th className="py-2 pr-4">Costo ant. → nuevo</th>
            <th className="py-2 pr-4">Precio ant. → nuevo</th>
            <th className="py-2 pr-4">Margen ant. → nuevo</th>
            <th className="py-2">Fuente</th>
          </tr>
        </thead>
        <tbody>
          {historial.map((entrada) => (
            <tr key={entrada.id} className="border-b border-border">
              <td className="py-2 pr-4 tabular-nums">
                <TendenciaFecha entrada={entrada} />
              </td>
              <td className="py-2 pr-4 tabular-nums">
                {formatCurrency(entrada.costoAnterior)} → {formatCurrency(entrada.costoNuevo)}
              </td>
              <td className="py-2 pr-4 tabular-nums">
                {formatCurrency(entrada.precioVentaAnterior)} → {formatCurrency(entrada.precioVentaNuevo)}
              </td>
              <td className="py-2 pr-4 tabular-nums">
                {entrada.margenDeseadoAnterior ?? '—'}% → {entrada.margenDeseadoNuevo ?? '—'}%
              </td>
              <td className="py-2 text-foreground-secondary">{FUENTE_LABEL[entrada.fuente]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
