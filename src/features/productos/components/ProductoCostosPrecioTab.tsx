import { LazyWidget } from '../../../app/LazyWidget';
import { ProductoAjustarCostoForm } from './ProductoAjustarCostoForm';
import { usePermisos } from '../../auth/hooks/usePermisos';
import { formatCurrency } from '../../../lib/formatCurrency';
import { PRODUCTO_ROLES_ESCRITURA, PRODUCTO_ROLES_HISTORIAL } from '../constants/producto.constants';
import type { ProductoDTO } from '../types/producto.types';

function CostoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-foreground-secondary">{label}</span>
      <span className="text-sm tabular-nums text-foreground">{value}</span>
    </div>
  );
}

// SPEC-009 REQ-U28/S6/S7 — el formulario de ajuste y el historial se gatean por rol de forma
// independiente (rolesEscritura vs rolesHistorial del backend, producto.routes.ts): un rol de solo
// historial (cajero) ve historial pero no el formulario de ajuste; un rol sin ninguno de los dos ve
// solo los valores actuales en modo lectura.
export function ProductoCostosPrecioTab({ producto }: { producto: ProductoDTO }) {
  const { data } = usePermisos();
  const role = data?.role;
  const puedeAjustar = Boolean(role && (PRODUCTO_ROLES_ESCRITURA as readonly string[]).includes(role));
  const puedeVerHistorial = Boolean(role && (PRODUCTO_ROLES_HISTORIAL as readonly string[]).includes(role));

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
