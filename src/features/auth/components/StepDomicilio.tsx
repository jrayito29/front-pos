import type { ChangeEvent } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Input } from '../../../components/Input';
import type { CompletarPerfilFormValues } from '../schemas/completarPerfil.schema';

interface StepDomicilioProps {
  methods: UseFormReturn<CompletarPerfilFormValues>;
}

// REQ-U8 — bloquea letras/signos en tiempo real (el maxLength del input solo limita cantidad de
// caracteres, no su tipo); el Zod schema sigue siendo la fuente de verdad para el formato final.
function sanitizeCodigoPostalInput(event: ChangeEvent<HTMLInputElement>) {
  event.target.value = event.target.value.replace(/\D/g, '');
}

// SPEC-004 REQ-U5 — 100% opcional; la acción "Omitir por ahora" vive en CompletarPerfilWizard
// (mismo efecto que "Siguiente" al no requerir captura de datos, ver REQ-E1).
export function StepDomicilio({ methods }: StepDomicilioProps) {
  const {
    register,
    formState: { errors },
  } = methods;

  return (
    <div className="flex flex-col gap-4">
      <Input label="Calle (opcional)" autoComplete="address-line1" error={errors.calle?.message} {...register('calle')} />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Número exterior (opcional)"
          error={errors.numeroExterior?.message}
          {...register('numeroExterior')}
        />
        <Input
          label="Número interior (opcional)"
          error={errors.numeroInterior?.message}
          {...register('numeroInterior')}
        />
      </div>
      <Input label="Colonia (opcional)" error={errors.colonia?.message} {...register('colonia')} />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Ciudad (opcional)"
          autoComplete="address-level2"
          error={errors.ciudad?.message}
          {...register('ciudad')}
        />
        <Input
          label="Estado (opcional)"
          autoComplete="address-level1"
          error={errors.estado?.message}
          {...register('estado')}
        />
      </div>
      <Input
        label="Código postal (opcional)"
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={5}
        error={errors.codigoPostal?.message}
        {...register('codigoPostal', { onChange: sanitizeCodigoPostalInput })}
      />
    </div>
  );
}
