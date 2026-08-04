import { useState } from 'react';
import { Skeleton } from '../../../components/Skeleton';
import { Select } from '../../../components/Select';
import { ProductoHistorialChart } from './ProductoHistorialChart';
import { ProductoHistorialTabla } from './ProductoHistorialTabla';
import { useHistorialPrecios } from '../hooks/useHistorialPrecios';
import { PERIODO_HISTORIAL_KEYS, type PeriodoHistorial } from '../constants/producto.constants';

const PERIODO_OPTIONS = PERIODO_HISTORIAL_KEYS.map((key) => ({ value: key, label: key.charAt(0).toUpperCase() + key.slice(1) }));

const MIN_PUNTOS_PARA_GRAFICA = 4;

interface ProductoHistorialWidgetProps {
  productoId: string;
}

// SPEC-009 REQ-U30/U31/S3 — cargado vía app/LazyWidget.tsx (SPEC-006 REQ-U5), aislado del resto de la
// vista. Export default: requerido por el `loader` de LazyWidget.
function ProductoHistorialWidget({ productoId }: ProductoHistorialWidgetProps) {
  const [periodo, setPeriodo] = useState<PeriodoHistorial>('todo');
  const { data: historial, isLoading } = useHistorialPrecios(productoId, periodo);

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-background-secondary p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Historial de precios</h3>
        <div className="w-40">
          <Select
            label="Periodo"
            hideLabel
            options={PERIODO_OPTIONS}
            value={periodo}
            onChange={(value) => setPeriodo((value ?? 'todo') as PeriodoHistorial)}
          />
        </div>
      </div>

      {isLoading && (
        <div role="status" aria-busy="true" aria-label="Cargando historial" className="flex flex-col gap-2">
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!isLoading && historial && historial.length === 0 && (
        <p className="py-8 text-center text-sm text-foreground-secondary">Aún no hay historial de precios registrado.</p>
      )}

      {!isLoading && historial && historial.length > 0 && (
        <>
          {historial.length < MIN_PUNTOS_PARA_GRAFICA ? (
            <p className="text-sm text-foreground-secondary">Aún no hay suficiente historial para graficar.</p>
          ) : (
            <ProductoHistorialChart historial={historial} />
          )}
          <ProductoHistorialTabla historial={historial} />
        </>
      )}
    </div>
  );
}

export default ProductoHistorialWidget;
