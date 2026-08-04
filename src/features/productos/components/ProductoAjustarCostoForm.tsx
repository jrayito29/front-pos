import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { MaskedInput } from '../../../components/MaskedInput';
import { Button } from '../../../components/Button';
import { SaveIcon } from './icons';
import { ajustarCostoSchema, type AjustarCostoInput, type AjustarCostoOutput } from '../schemas/ajustarCosto.schema';
import { useAjustarCosto } from '../hooks/useAjustarCosto';
import { applyProductoApiError } from '../hooks/applyProductoApiError';
import { calcularPrecioVentaSugerido } from '../../../lib/calcularPrecioVentaSugerido';
import { formatCurrency } from '../../../lib/formatCurrency';
import type { ProductoDTO, MargenAlertaDTO } from '../types/producto.types';

// SPEC-009 REQ-U28/E6 — "Ajustar costo" es una acción de negocio propia (genera historial), no un
// campo más del tab de edición general. La `alerta` de margen reducido se muestra inline (nunca
// toast) porque el ajuste ya se guardó — es informativa, no bloqueante. Todos los campos decimales
// usan `MaskedInput` (react-imask) — nunca `type="number"` ni texto libre (letras).
export function ProductoAjustarCostoForm({ producto }: { producto: ProductoDTO }) {
  const [alerta, setAlerta] = useState<MargenAlertaDTO | undefined>();
  const ajustarCosto = useAjustarCosto();

  const form = useForm<AjustarCostoInput, unknown, AjustarCostoOutput>({
    resolver: zodResolver(ajustarCostoSchema),
    defaultValues: {
      costoEstimado: producto.costoEstimado,
      costoPromedio: producto.costoPromedio,
      precioVenta: producto.precioVenta,
      margenDeseadoPorcentaje: producto.margenDeseadoPorcentaje ?? undefined,
    },
  });

  const costoEstimado = useWatch({ control: form.control, name: 'costoEstimado' });
  const costoPromedio = useWatch({ control: form.control, name: 'costoPromedio' });
  const margen = useWatch({ control: form.control, name: 'margenDeseadoPorcentaje' });
  const sugerido = calcularPrecioVentaSugerido(costoEstimado, costoPromedio, margen);

  function onSubmit(values: AjustarCostoOutput) {
    setAlerta(undefined);
    ajustarCosto.mutate(
      { id: producto.id, payload: values },
      {
        onSuccess: ({ alerta: nuevaAlerta }) => {
          toast.success('Costo actualizado');
          setAlerta(nuevaAlerta);
        },
        onError: (error) => {
          const mapped = applyProductoApiError(error, form.setError);
          if (!mapped) toast.error(error.message);
        },
      }
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-lg bg-background-secondary p-4">
      <h3 className="text-sm font-semibold text-foreground">Ajustar costo</h3>
      <div className="grid grid-cols-2 gap-4">
        <Controller
          control={form.control}
          name="costoEstimado"
          render={({ field }) => (
            <MaskedInput
              label="Costo estimado (MXN)"
              kind="currency"
              value={String(field.value ?? '')}
              onChange={field.onChange}
              error={form.formState.errors.costoEstimado?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="costoPromedio"
          render={({ field }) => (
            <MaskedInput
              label="Costo promedio (MXN)"
              kind="currency"
              value={String(field.value ?? '')}
              onChange={field.onChange}
              error={form.formState.errors.costoPromedio?.message}
            />
          )}
        />
        <div className="flex flex-col gap-1.5">
          <Controller
            control={form.control}
            name="precioVenta"
            render={({ field }) => (
              <MaskedInput
                label="Precio de venta (MXN)"
                kind="currency"
                value={String(field.value ?? '')}
                onChange={field.onChange}
                error={form.formState.errors.precioVenta?.message}
              />
            )}
          />
          {sugerido !== null && (
            <button
              type="button"
              onClick={() => form.setValue('precioVenta', sugerido.toFixed(2), { shouldValidate: true })}
              className="self-start text-xs text-brand-green-text hover:underline"
            >
              Sugerido: {formatCurrency(sugerido)} — usar
            </button>
          )}
        </div>
        <Controller
          control={form.control}
          name="margenDeseadoPorcentaje"
          render={({ field }) => (
            <MaskedInput
              label="Margen deseado (%)"
              kind="percentage"
              max={99.99}
              value={String(field.value ?? '')}
              onChange={field.onChange}
              error={form.formState.errors.margenDeseadoPorcentaje?.message}
            />
          )}
        />
      </div>
      {alerta && (
        <div role="status" className="rounded-md bg-brand-coral-bg px-3.5 py-2.5 text-sm text-brand-coral-text">
          Margen reducido: {alerta.margenReal}% real vs {alerta.margenDeseado}% deseado.
        </div>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="sm" isLoading={ajustarCosto.isPending} loadingText="Guardando...">
          <SaveIcon className="h-4 w-4" />
          Guardar ajuste
        </Button>
      </div>
    </form>
  );
}
