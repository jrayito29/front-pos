import type { ChangeEvent } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Input } from '../../../components/Input';
import type { CompletarPerfilFormValues } from '../schemas/completarPerfil.schema';

interface StepDatosPersonalesProps {
  methods: UseFormReturn<CompletarPerfilFormValues>;
}

// REQ-U8 — bloquea letras/signos en tiempo real (el maxLength del input solo limita cantidad de
// caracteres, no su tipo); el Zod schema sigue siendo la fuente de verdad para el formato final.
function sanitizeTelefonoInput(event: ChangeEvent<HTMLInputElement>) {
  event.target.value = event.target.value.replace(/[^\d\s-]/g, '');
}

// SPEC-004 REQ-U4 — nombre/apellidoPaterno requeridos; apellidoMaterno/telefono opcionales.
export function StepDatosPersonales({ methods }: StepDatosPersonalesProps) {
  const {
    register,
    formState: { errors },
  } = methods;

  return (
    <div className="flex flex-col gap-4">
      <Input label="Nombre" autoComplete="given-name" error={errors.nombre?.message} {...register('nombre')} />
      <Input
        label="Apellido paterno"
        autoComplete="family-name"
        error={errors.apellidoPaterno?.message}
        {...register('apellidoPaterno')}
      />
      <Input
        label="Apellido materno (opcional)"
        autoComplete="additional-name"
        error={errors.apellidoMaterno?.message}
        {...register('apellidoMaterno')}
      />
      <Input
        label="Teléfono (opcional)"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        maxLength={12}
        error={errors.telefono?.message}
        {...register('telefono', { onChange: sanitizeTelefonoInput })}
      />
    </div>
  );
}
