import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import { Switch } from '../../../components/Switch';
import { MaskedInput } from '../../../components/MaskedInput';
import { Button } from '../../../components/Button';
import { CategoriaSelect } from './CategoriaSelect';
import { SubcategoriaSelect } from './SubcategoriaSelect';
import { SaveIcon } from './icons';
import { actualizarProductoSchema, type ActualizarProductoInput, type ActualizarProductoOutput } from '../schemas/actualizarProducto.schema';
import { useActualizarProducto } from '../hooks/useActualizarProducto';
import { applyProductoApiError } from '../hooks/applyProductoApiError';
import { TIPO_PRODUCTO, UNIDADES_MEDIDA } from '../constants/producto.constants';
import type { ProductoDTO } from '../types/producto.types';

const UNIDAD_OPTIONS = UNIDADES_MEDIDA.map((unidad) => ({ value: unidad.key, label: unidad.label }));

interface ProductoInfoGeneralFormProps {
  producto: ProductoDTO;
  onSaved: () => void;
}

// SPEC-009 REQ-U25/U27/S5 — form del tab "Información general" en modo edición, con su propia
// mutación (`PATCH /:id`), independiente de Costos/Tags/Estado. `tipo` no es un campo aquí (inmutable,
// REQ-U34); los campos exclusivos de FISICO se ocultan por completo si el producto es SERVICIO.
export function ProductoInfoGeneralForm({ producto, onSaved }: ProductoInfoGeneralFormProps) {
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
      unidadMedida: producto.unidadMedida?.key,
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="SKU" error={form.formState.errors.sku?.message} {...form.register('sku')} />
        {isFisico && (
          <Input
            label="Código de barras"
            error={form.formState.errors.codigoBarras?.message}
            {...form.register('codigoBarras')}
          />
        )}
      </div>
      <Input label="Nombre corto" error={form.formState.errors.nombreCorto?.message} {...form.register('nombreCorto')} />
      <Input label="Nombre largo" error={form.formState.errors.nombreLargo?.message} {...form.register('nombreLargo')} />
      <div className="grid grid-cols-2 gap-4">
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
      </div>
      {isFisico && (
        <div className="grid grid-cols-2 items-end gap-4">
          <Controller
            control={form.control}
            name="unidadMedida"
            render={({ field }) => (
              <Select
                label="Unidad de medida"
                placeholder="Selecciona una unidad"
                options={UNIDAD_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={form.formState.errors.unidadMedida?.message}
              />
            )}
          />
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
          <Controller
            control={form.control}
            name="requiereBascula"
            render={({ field }) => <Switch label="Requiere báscula" checked={field.value ?? false} onChange={field.onChange} />}
          />
        </div>
      )}
      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button type="submit" size="sm" isLoading={actualizarProducto.isPending} loadingText="Guardando...">
          <SaveIcon className="h-4 w-4" />
          Guardar
        </Button>
      </div>
    </form>
  );
}
