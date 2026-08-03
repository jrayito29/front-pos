import type { UseFormReturn } from 'react-hook-form';
import { Input } from '../../../components/Input';
import type { CompletarPerfilFormValues } from '../schemas/completarPerfil.schema';

interface StepEmpresaProps {
  methods: UseFormReturn<CompletarPerfilFormValues>;
  disabled?: boolean;
}

// SPEC-004 REQ-U6/S4 — empresa.nombre requerido, empresa.rfc opcional. `disabled` se activa
// mientras la mutación de completar-perfil está en curso (REQ-S4), para evitar edición a mitad
// de la petición.
export function StepEmpresa({ methods, disabled }: StepEmpresaProps) {
  const {
    register,
    formState: { errors },
  } = methods;

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Nombre de la empresa"
        error={errors.empresa?.nombre?.message}
        disabled={disabled}
        {...register('empresa.nombre')}
      />
      <Input
        label="RFC (opcional)"
        error={errors.empresa?.rfc?.message}
        disabled={disabled}
        {...register('empresa.rfc')}
      />
    </div>
  );
}
