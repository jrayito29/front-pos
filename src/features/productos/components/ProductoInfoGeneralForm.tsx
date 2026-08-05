import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '../../../components/Input';
import { Switch } from '../../../components/Switch';
import { MaskedInput } from '../../../components/MaskedInput';
import { Button } from '../../../components/Button';
import { CategoriaSelect } from './CategoriaSelect';
import { SubcategoriaSelect } from './SubcategoriaSelect';
import { UnidadMedidaSelect } from './UnidadMedidaSelect';
import { SaveIcon } from '../../../components/icons';
import { actualizarProductoSchema, type ActualizarProductoInput, type ActualizarProductoOutput } from '../schemas/actualizarProducto.schema';
import { useActualizarProducto } from '../hooks/useActualizarProducto';
import { applyProductoApiError } from '../hooks/applyProductoApiError';
import { TIPO_PRODUCTO } from '../constants/producto.constants';
import type { ProductoDTO } from '../types/producto.types';

interface ProductoInfoGeneralFormProps {
  producto: ProductoDTO;
  onSaved: () => void;
  onCancel: () => void;
}

// SPEC-009 REQ-U25/U27/S5 — form del tab "Información general" en modo edición, con su propia
// mutación (`PATCH /:id`), independiente de Costos/Tags/Estado. `tipo` no es un campo aquí (inmutable,
// REQ-U34); los campos exclusivos de FISICO se ocultan por completo si el producto es SERVICIO.
// RESPUESTA visual 2026-08-05 — secciones "Identificación"/"Clasificación" (encabezado uppercase +
// línea divisoria) y espaciados calcados de ProductoIdentificacionFields/ProductoClasificacionFields
// (form de Crear): antes este form apilaba inputs sueltos con grids ad hoc, sin relación visual con
// Crear pese a compartir los mismos campos. No se reutilizan esos componentes tal cual porque están
// tipados a `CrearProductoInput`/`FormProvider` (useFormContext) — este form usa `ActualizarProductoInput`
// con `form.control` directo; misma estructura JSX, tipos de formulario distintos.
export function ProductoInfoGeneralForm({ producto, onSaved, onCancel }: ProductoInfoGeneralFormProps) {
  const actualizarProducto = useActualizarProducto();
  const form = useForm<ActualizarProductoInput, unknown, ActualizarProductoOutput>({
    resolver: zodResolver(actualizarProductoSchema),
    defaultValues: {
      sku: producto.sku ?? undefined,
      codigoBarras: producto.codigoBarras ?? undefined,
      nombreCorto: producto.nombreCorto,
      nombreLargo: producto.nombreLargo,
      categoriaId: producto.categoriaId ?? undefined,
      subcategoriaId: producto.subcategoriaId ?? undefined,
      unidadMedidaId: producto.unidadMedida?.id,
      requiereBascula: producto.requiereBascula,
      stockMinimo: producto.stockMinimo ?? undefined,
    },
  });

  const categoriaId = useWatch<ActualizarProductoInput, 'categoriaId'>({ control: form.control, name: 'categoriaId' });

  function onSubmit(values: ActualizarProductoOutput) {
    actualizarProducto.mutate(
      { id: producto.id, payload: values },
      {
        onSuccess: ({ advertencias }) => {
          toast.success('Cambios guardados');
          if (advertencias?.length) {
            advertencias.forEach((advertencia) => toast.warning(advertencia.mensaje));
          }
          onSaved();
        },
        onError: (error) => {
          const mapped = applyProductoApiError(error, form.setError);
          if (!mapped) toast.error(error.message);
        },
      }
    );
  }

  const isFisico = producto.tipo === TIPO_PRODUCTO.FISICO;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wide text-foreground-secondary">Identificación</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Input label="Nombre largo" error={form.formState.errors.nombreLargo?.message} {...form.register('nombreLargo')} />
          </div>
          <Input label="Nombre corto" error={form.formState.errors.nombreCorto?.message} {...form.register('nombreCorto')} />
        </div>

        <div className={`grid grid-cols-1 gap-4 ${isFisico ? 'sm:grid-cols-2' : ''}`}>
          <Input label="SKU" error={form.formState.errors.sku?.message} {...form.register('sku')} />
          {isFisico && (
            <Input
              label="Código de barras"
              error={form.formState.errors.codigoBarras?.message}
              {...form.register('codigoBarras')}
            />
          )}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wide text-foreground-secondary">Clasificación</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Controller
            control={form.control}
            name="categoriaId"
            render={({ field }) => (
              <CategoriaSelect
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  form.setValue('subcategoriaId', undefined);
                }}
                error={form.formState.errors.categoriaId?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="subcategoriaId"
            render={({ field }) => (
              <SubcategoriaSelect
                categoriaId={categoriaId}
                value={field.value}
                onChange={field.onChange}
                error={form.formState.errors.subcategoriaId?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="unidadMedidaId"
            render={({ field }) => (
              <UnidadMedidaSelect
                tipoProducto={producto.tipo}
                value={field.value}
                onChange={field.onChange}
                error={form.formState.errors.unidadMedidaId?.message}
              />
            )}
          />
          {isFisico && (
            <Controller
              control={form.control}
              name="stockMinimo"
              render={({ field }) => (
                <MaskedInput
                  label="Stock mínimo"
                  kind="integer"
                  value={field.value !== undefined ? String(field.value) : ''}
                  onChange={(value) => field.onChange(value === '' ? undefined : Number(value))}
                  error={form.formState.errors.stockMinimo?.message}
                />
              )}
            />
          )}
        </div>

        {isFisico && (
          <Controller
            control={form.control}
            name="requiereBascula"
            render={({ field }) => <Switch label="Requiere báscula" checked={field.value ?? false} onChange={field.onChange} />}
          />
        )}
      </fieldset>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" isLoading={actualizarProducto.isPending} loadingText="Guardando...">
          <SaveIcon className="h-4 w-4" />
          Guardar
        </Button>
      </div>
    </form>
  );
}
