import { Controller, useFormContext } from 'react-hook-form';
import { Badge } from '../../../components/Badge';
import { Switch } from '../../../components/Switch';
import { ALMACENES_DEFAULT_INFO } from '../constants/sucursal.constants';
import type { CrearSucursalInput } from '../schemas/crearSucursal.schema';

// SPEC-012 REQ-U8 — sección "Almacenes que se crearán" de SucursalCrearForm: Ventas/Mermas/Tránsito
// se muestran fijos en `true` y deshabilitados (siempre se crean, REQ-E1 del backend); Reserva y
// Apartados son los únicos Switch editables, mapeando a `incluirReserva`/`incluirApartados`. Cada
// fila es una card tipo "settings list item" (label + descripción a la izquierda, badge + switch a
// la derecha) — el switch usa `hideLabel` porque el nombre del almacén ya se muestra como título de
// la fila, evitando duplicar el texto.
export function SucursalAlmacenesOpcionalesFields() {
  const { control } = useFormContext<CrearSucursalInput>();

  return (
    <fieldset className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-foreground-secondary">
          Almacenes que se crearán
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="flex flex-col gap-2.5">
        {ALMACENES_DEFAULT_INFO.map((almacen) =>
          almacen.flag ? (
            <Controller
              key={almacen.tipo}
              control={control}
              name={almacen.flag}
              render={({ field }) => (
                <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{almacen.nombre}</span>
                    <span className="text-xs text-foreground-muted">{almacen.description}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone="neutral">Opcional</Badge>
                    <Switch label={almacen.nombre} hideLabel checked={field.value ?? false} onChange={field.onChange} />
                  </div>
                </div>
              )}
            />
          ) : (
            <div key={almacen.tipo} className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{almacen.nombre}</span>
                <span className="text-xs text-foreground-muted">{almacen.description}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge tone="neutral">Siempre se crea</Badge>
                <Switch label={almacen.nombre} hideLabel checked disabled onChange={() => {}} />
              </div>
            </div>
          )
        )}
      </div>
    </fieldset>
  );
}
