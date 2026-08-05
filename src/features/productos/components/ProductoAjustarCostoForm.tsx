import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { MaskedInput } from '../../../components/MaskedInput';
import { Button } from '../../../components/Button';
import { SaveIcon } from '../../../components/icons';
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
// RESPUESTA visual 2026-08-05 — sin input de "Costo promedio": es conceptualmente un campo que
// calcula el sistema (actualizado por Órdenes de Compra vía `registrarCambioPrecios`, REQ-E10 del
// backend), no algo que el usuario deba estimar a mano en este form. `costoPromedio` se omite de
// `defaultValues` a propósito para que el PATCH nunca lo reenvíe (edición parcial); se sigue leyendo
// de `producto.costoPromedio` (solo lectura) para el cálculo de `precioVentaSugerido` (REQ-E9).
export function ProductoAjustarCostoForm({ producto }: { producto: ProductoDTO }) {
  const [alerta, setAlerta] = useState<MargenAlertaDTO | undefined>();
  const ajustarCosto = useAjustarCosto();

  const form = useForm<AjustarCostoInput, unknown, AjustarCostoOutput>({
    resolver: zodResolver(ajustarCostoSchema),
    defaultValues: {
      costoEstimado: producto.costoEstimado,
      precioVenta: producto.precioVenta,
      margenDeseadoPorcentaje: producto.margenDeseadoPorcentaje ?? undefined,
    },
  });

  const costoEstimado = useWatch({ control: form.control, name: 'costoEstimado' });
  const margen = useWatch({ control: form.control, name: 'margenDeseadoPorcentaje' });
  const sugerido = calcularPrecioVentaSugerido(costoEstimado, producto.costoPromedio, margen);

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>
      {alerta && (
        <div role="status" className="rounded-md bg-brand-coral-bg px-3.5 py-2.5 text-sm text-brand-coral-text">
          Margen reducido: {alerta.margenReal}% real vs {alerta.margenDeseado}% deseado.
        </div>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="sm" isLoading={ajustarCosto.isPending} loadingText="Guardando...">
          <SaveIcon className="h-4 w-4" />
          Guardar
        </Button>
      </div>
    </form>
  );
}
