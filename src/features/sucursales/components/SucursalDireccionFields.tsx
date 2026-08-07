import type { ChangeEvent } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '../../../components/Input';
import type { CrearSucursalInput } from '../schemas/crearSucursal.schema';


function sanitizeCodigoPostalInput(event: ChangeEvent<HTMLInputElement>) {
  event.target.value = event.target.value.replace(/\D/g, '');
}

interface SucursalDireccionFieldsProps {
  direccionCompletaSugerida: string;
}

// SPEC-012 REQ-U5 (actualizado) — usado únicamente por SucursalCrearForm (useFormContext<CrearSucursalInput>).
// SucursalInfoGeneralForm (editar) NO reutiliza este componente: mismo criterio que
// ProductoIdentificacionFields/ProductoInfoGeneralForm — tipos de formulario distintos
// (CrearSucursalInput vs ActualizarSucursalInput), misma estructura JSX duplicada a propósito.
// `direccionCompletaSugerida` se calcula en el padre (buildDireccionCompleta) a partir de los 7
// campos y se ofrece como sugerencia clickeable — mismo patrón que
// ProductoIdentificacionFields/ProductoCostosFields. El campo `direccionCompleta` del formulario es
// libremente editable; si el usuario lo deja vacío, el submit usa la sugerencia calculada como
// fallback (ver SucursalCrearForm).
export function SucursalDireccionFields({ direccionCompletaSugerida }: SucursalDireccionFieldsProps) {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<CrearSucursalInput>();

  return (
    <fieldset className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-foreground-secondary">Dirección</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <Input label="Calle" required error={errors.calle?.message} {...register('calle')} />
        </div>
        <Input label="Núm. exterior" required error={errors.numeroExterior?.message} {...register('numeroExterior')} />
        <Input label="Núm. interior" error={errors.numeroInterior?.message} {...register('numeroInterior')} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input label="Colonia" required error={errors.colonia?.message} {...register('colonia')} />
        <Input label="Municipio" required error={errors.municipio?.message} {...register('municipio')} />
        <Input label="Estado" required error={errors.estado?.message} {...register('estado')} />
      </div>

      <div className="sm:w-48">
        <Input
          label="Código postal (opcional)"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          error={errors.codigoPostal?.message}
          {...register('codigoPostal', { onChange: sanitizeCodigoPostalInput })}
        />
      </div>

      {direccionCompletaSugerida && (
        <div className="flex flex-col gap-1.5">
          <Input
            label="Dirección completa"
            placeholder={direccionCompletaSugerida}
            error={errors.direccionCompleta?.message}
            {...register('direccionCompleta')}
          />
          <button
            type="button"
            onClick={() => setValue('direccionCompleta', direccionCompletaSugerida, { shouldValidate: true })}
            className="self-start text-xs text-brand-green-text hover:underline"
          >
            Sugerencia: "{direccionCompletaSugerida}" — usar
          </button>
        </div>
      )}
    </fieldset>
  );
}
