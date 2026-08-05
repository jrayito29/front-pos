import { LazyWidget } from '../../../app/LazyWidget';
import { ProductoAjustarCostoForm } from './ProductoAjustarCostoForm';
import { usePermisos, puedeAccion } from '../../auth/hooks/usePermisos';
import { formatCurrency } from '../../../lib/formatCurrency';
import { PRODUCTO_ACCION } from '../constants/producto.constants';
import type { ProductoDTO } from '../types/producto.types';

function CostoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-foreground-secondary">{label}</span>
      <span className="text-sm tabular-nums text-foreground">{value}</span>
    </div>
  );
}

// SPEC-009 REQ-U28/S6/S7 — el formulario de ajuste y el historial se gatean por acciones
// independientes del catálogo dinámico (`producto.ajustar_costo` / `producto.ver_historial`,
// RESPUESTA-006): un rol sin ninguna de las dos ve solo los valores actuales en modo lectura.
export function ProductoCostosPrecioTab({ producto }: { producto: ProductoDTO }) {
  const { data } = usePermisos();
  const puedeAjustar = puedeAccion(data, PRODUCTO_ACCION.AJUSTAR_COSTO);
  const puedeVerHistorial = puedeAccion(data, PRODUCTO_ACCION.VER_HISTORIAL);

  return (
    <div className="flex flex-col gap-4">
      {puedeAjustar ? (
        <ProductoAjustarCostoForm producto={producto} />
      ) : (
        <div className="grid grid-cols-2 gap-4 rounded-lg bg-background-secondary p-4">
          <CostoField label="Costo estimado" value={formatCurrency(producto.costoEstimado)} />
          <CostoField label="Costo promedio" value={formatCurrency(producto.costoPromedio)} />
          <CostoField label="Precio de venta" value={formatCurrency(producto.precioVenta)} />
          <CostoField label="Margen deseado" value={producto.margenDeseadoPorcentaje ? `${producto.margenDeseadoPorcentaje}%` : '—'} />
        </div>
      )}

      {puedeVerHistorial && (
        <LazyWidget
          label="el historial de precios"
          loader={() => import('./ProductoHistorialWidget')}
          componentProps={{ productoId: producto.id }}
        />
      )}
    </div>
  );
}
