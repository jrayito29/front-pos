import { useFormContext, useWatch } from 'react-hook-form';
import { Input } from '../../../components/Input';
import { suggestNombreCorto } from '../../../lib/suggestNombreCorto';
import { TIPO_PRODUCTO, type TipoProductoDomain } from '../constants/producto.constants';
import type { CrearProductoInput } from '../schemas/crearProducto.schema';

// SPEC-009 REQ-U19/U36 — grupo "Identificación". Nombre largo ocupa 2/3 del ancho y nombre corto 1/3
// en pantallas grandes (`sm:` — 640px, breakpoint estándar del proyecto); por debajo se apilan en dos
// filas. Extraído para mantener ProductoCrearForm bajo el límite de ~150 líneas (CLAUDE.md §9).
export function ProductoIdentificacionFields({ tipo }: { tipo: TipoProductoDomain }) {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<CrearProductoInput>();

  const nombreLargo = useWatch<CrearProductoInput, 'nombreLargo'>({ name: 'nombreLargo' }) ?? '';
  const nombreCorto = useWatch<CrearProductoInput, 'nombreCorto'>({ name: 'nombreCorto' }) ?? '';
  const sugerencia = !nombreCorto && nombreLargo.trim().length > 0 ? suggestNombreCorto(nombreLargo) : null;

  return (
    <fieldset className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-foreground-secondary">Identificación</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Input label="Nombre largo" required error={errors.nombreLargo?.message} {...register('nombreLargo')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Input label="Nombre corto" required error={errors.nombreCorto?.message} {...register('nombreCorto')} />
          {sugerencia && (
            <button
              type="button"
              onClick={() => setValue('nombreCorto', sugerencia, { shouldValidate: true })}
              className="self-start text-xs text-brand-green-text hover:underline"
            >
              Sugerencia: "{sugerencia}" — usar
            </button>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-4 ${tipo === TIPO_PRODUCTO.FISICO ? 'sm:grid-cols-2' : ''}`}>
        <Input label="SKU" error={errors.sku?.message} {...register('sku')} />
        {tipo === TIPO_PRODUCTO.FISICO && (
          <Input label="Código de barras" error={errors.codigoBarras?.message} {...register('codigoBarras')} />
        )}
      </div>
    </fieldset>
  );
}
