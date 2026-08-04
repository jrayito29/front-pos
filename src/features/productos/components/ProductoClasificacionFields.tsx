import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Select } from '../../../components/Select';
import { Switch } from '../../../components/Switch';
import { CategoriaSelect } from './CategoriaSelect';
import { SubcategoriaSelect } from './SubcategoriaSelect';
import { TIPO_PRODUCTO, UNIDADES_MEDIDA, type TipoProductoDomain } from '../constants/producto.constants';
import type { CrearProductoInput } from '../schemas/crearProducto.schema';

const TIPO_OPTIONS = [
  { value: TIPO_PRODUCTO.FISICO, label: 'Físico' },
  { value: TIPO_PRODUCTO.SERVICIO, label: 'Servicio' },
];

const UNIDAD_OPTIONS = UNIDADES_MEDIDA.map((unidad) => ({ value: unidad.key, label: unidad.label }));

// SPEC-009 REQ-U19/U22/U46 — grupo "Clasificación": tipo/categoría/subcategoría/unidad en grid de 3
// columnas. Categoría es requerida (REQ-U46); subcategoría es opcional y solo lista las hijas de la
// categoría elegida — se limpia automáticamente si el usuario cambia de categoría. Los campos
// exclusivos de FISICO se ocultan por completo cuando `tipo=SERVICIO` (nunca deshabilitados).
export function ProductoClasificacionFields({ tipo }: { tipo: TipoProductoDomain }) {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<CrearProductoInput>();

  const categoriaId = useWatch<CrearProductoInput, 'categoriaId'>({ name: 'categoriaId' });

  return (
    <fieldset className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-foreground-secondary">Clasificación</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => <Select label="Tipo" required options={TIPO_OPTIONS} value={field.value} onChange={field.onChange} />}
        />
        <Controller
          control={control}
          name="categoriaId"
          render={({ field }) => (
            <CategoriaSelect
              required
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                setValue('subcategoriaId', undefined);
              }}
              error={errors.categoriaId?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="subcategoriaId"
          render={({ field }) => (
            <SubcategoriaSelect
              categoriaId={categoriaId}
              value={field.value}
              onChange={field.onChange}
              error={errors.subcategoriaId?.message}
            />
          )}
        />
        {tipo === TIPO_PRODUCTO.FISICO && (
          <Controller
            control={control}
            name="unidadMedida"
            render={({ field }) => (
              <Select
                label="Unidad de medida"
                placeholder="Selecciona una unidad"
                options={UNIDAD_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errors.unidadMedida?.message}
              />
            )}
          />
        )}
      </div>

      {tipo === TIPO_PRODUCTO.FISICO && (
        <Controller
          control={control}
          name="requiereBascula"
          render={({ field }) => <Switch label="Requiere báscula" checked={field.value ?? false} onChange={field.onChange} />}
        />
      )}
    </fieldset>
  );
}
