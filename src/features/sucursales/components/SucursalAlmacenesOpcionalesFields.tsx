import { Controller, useFormContext } from 'react-hook-form';
import { Switch } from '../../../components/Switch';
import { ALMACENES_DEFAULT_INFO } from '../constants/sucursal.constants';
import type { CrearSucursalInput } from '../schemas/crearSucursal.schema';

// SPEC-012 REQ-U8 — sección "Almacenes que se crearán" de SucursalCrearForm: Ventas/Mermas/Tránsito
// se muestran fijos en `true` y deshabilitados (siempre se crean, REQ-E1 del backend); Reserva y
// Apartados son los únicos Switch editables, mapeando a `incluirReserva`/`incluirApartados`.
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
                <div className="flex items-center justify-between gap-2">
                  <Switch label={almacen.nombre} checked={field.value ?? false} onChange={field.onChange} />
                  <span className="text-xs text-foreground-muted">Opcional</span>
                </div>
              )}
            />
          ) : (
            <div key={almacen.tipo} className="flex items-center justify-between gap-2">
              <Switch label={almacen.nombre} checked disabled onChange={() => {}} />
              <span className="text-xs text-foreground-muted">Siempre se crea</span>
            </div>
          )
        )}
      </div>
    </fieldset>
  );
}
