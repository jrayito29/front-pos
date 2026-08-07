import { useState } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Input } from '../../../components/Input';
import type { CrearAlmacenInput } from '../schemas/crearAlmacen.schema';

interface AlmacenDireccionFieldsProps {
  register: UseFormRegister<CrearAlmacenInput>;
  errors: FieldErrors<CrearAlmacenInput>;
  initiallyOpen: boolean;
}

// SPEC-012 REQ-E7 — sección opcional dentro de AlmacenFormModal (mismo schema en ambos modos, sin
// necesidad de tipos genéricos). Colapsada por defecto al crear: si el usuario no la abre/completa,
// no se envía ningún campo de dirección y el backend hereda la de la sucursal padre (api-pos
// SPEC-014 REQ-E8). Abierta por defecto al editar un almacén que ya tiene dirección propia
// (`initiallyOpen`, resuelto por el padre) — nunca esconder datos ya guardados detrás de un clic.
export function AlmacenDireccionFields({ register, errors, initiallyOpen }: AlmacenDireccionFieldsProps) {
  const [abierta, setAbierta] = useState(initiallyOpen);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setAbierta((open) => !open)}
        className="self-start text-xs font-medium text-brand-green-text hover:underline"
      >
        {abierta ? 'Ocultar dirección propia' : 'Usar una dirección distinta a la de la sucursal'}
      </button>

      {abierta && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-foreground-muted">Si no la completas, se usará la dirección de la sucursal.</p>
          <Input label="Calle" error={errors.calle?.message} {...register('calle')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Núm. exterior" error={errors.numeroExterior?.message} {...register('numeroExterior')} />
            <Input label="Núm. interior" error={errors.numeroInterior?.message} {...register('numeroInterior')} />
          </div>
          <Input label="Colonia" error={errors.colonia?.message} {...register('colonia')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Municipio" error={errors.municipio?.message} {...register('municipio')} />
            <Input label="Estado" error={errors.estado?.message} {...register('estado')} />
          </div>
          <Input
            label="Código postal"
            inputMode="numeric"
            maxLength={5}
            error={errors.codigoPostal?.message}
            {...register('codigoPostal')}
          />
        </div>
      )}
    </div>
  );
}
