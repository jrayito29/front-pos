import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { MaskedInput } from '../../../components/MaskedInput';
import { calcularPrecioVentaSugerido } from '../../../lib/calcularPrecioVentaSugerido';
import { formatCurrency } from '../../../lib/formatCurrency';
import { TIPO_PRODUCTO, type TipoProductoDomain } from '../constants/producto.constants';
import type { CrearProductoInput } from '../schemas/crearProducto.schema';

// SPEC-009 REQ-U19/U37/U38 — grupo "Costos y precio inicial", grid de 3 columnas. Todos los campos
// monetarios/porcentuales usan `MaskedInput` (react-imask) — nunca `type="number"` ni texto libre.
// `precioVenta` muestra `precioVentaSugerido` calculado en vivo como sugerencia clickeable.
export function ProductoCostosFields({ tipo }: { tipo: TipoProductoDomain }) {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<CrearProductoInput>();

  const costoEstimado = useWatch<CrearProductoInput, 'costoEstimado'>({ name: 'costoEstimado' });
  const margen = useWatch<CrearProductoInput, 'margenDeseadoPorcentaje'>({ name: 'margenDeseadoPorcentaje' });
  const sugerido = calcularPrecioVentaSugerido(costoEstimado, undefined, margen);

  return (
    <fieldset className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-foreground-secondary">Costos y precio</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Controller
          control={control}
          name="costoEstimado"
          render={({ field }) => (
            <MaskedInput
              label="Costo estimado (MXN)"
              kind="currency"
              value={String(field.value ?? '')}
              onChange={field.onChange}
              error={errors.costoEstimado?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="margenDeseadoPorcentaje"
          render={({ field }) => (
            <MaskedInput
              label="Margen deseado (%)"
              kind="percentage"
              max={99.99}
              value={String(field.value ?? '')}
              onChange={field.onChange}
              error={errors.margenDeseadoPorcentaje?.message}
            />
          )}
        />
        <div className="flex flex-col gap-1.5">
          <Controller
            control={control}
            name="precioVenta"
            render={({ field }) => (
              <MaskedInput
                label="Precio de venta (MXN)"
                kind="currency"
                value={String(field.value ?? '')}
                onChange={field.onChange}
                error={errors.precioVenta?.message}
              />
            )}
          />
          {sugerido !== null && (
            <button
              type="button"
              onClick={() => setValue('precioVenta', sugerido.toFixed(2), { shouldValidate: true })}
              className="self-start text-xs text-brand-green-text hover:underline"
            >
              Sugerido: {formatCurrency(sugerido)} — usar
            </button>
          )}
        </div>
        <Controller
          control={control}
          name="descuentoPorcentaje"
          render={({ field }) => (
            <MaskedInput
              label="Descuento (%)"
              kind="percentage"
              value={String(field.value ?? '')}
              onChange={field.onChange}
              error={errors.descuentoPorcentaje?.message}
            />
          )}
        />
        {tipo === TIPO_PRODUCTO.FISICO && (
          <Controller
            control={control}
            name="stockMinimo"
            render={({ field }) => (
              <MaskedInput
                label="Stock mínimo"
                kind="integer"
                value={field.value !== undefined ? String(field.value) : ''}
                onChange={(value) => field.onChange(value === '' ? undefined : Number(value))}
                error={errors.stockMinimo?.message}
              />
            )}
          />
        )}
      </div>
    </fieldset>
  );
}
