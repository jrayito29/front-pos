import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { SaveIcon } from '../../../components/icons';
import { SucursalCodigoInput } from './SucursalCodigoInput';
import { buildDireccionCompleta } from '../../../lib/buildDireccionCompleta';
import {
  actualizarSucursalSchema,
  type ActualizarSucursalInput,
  type ActualizarSucursalOutput,
} from '../schemas/actualizarSucursal.schema';
import { useActualizarSucursal } from '../hooks/useActualizarSucursal';
import { applySucursalApiError } from '../hooks/applySucursalApiError';
import type { SucursalDTO } from '../types/sucursal.types';

interface SucursalInfoGeneralFormProps {
  sucursal: SucursalDTO;
  onSaved: () => void;
  onCancel: () => void;
}

// SPEC-012 REQ-U6 — form del tab "Información general" en modo edición, con su propia mutación
// (`PATCH /:id`). No reutiliza SucursalDireccionFields (atado a `useFormContext<CrearSucursalInput>`):
// mismo criterio que ProductoInfoGeneralForm — tipos de formulario distintos, misma estructura JSX
// duplicada a propósito.
export function SucursalInfoGeneralForm({ sucursal, onSaved, onCancel }: SucursalInfoGeneralFormProps) {
  const actualizarSucursal = useActualizarSucursal();
  const form = useForm<ActualizarSucursalInput, unknown, ActualizarSucursalOutput>({
    resolver: zodResolver(actualizarSucursalSchema),
    defaultValues: {
      nombre: sucursal.nombre,
      codigoSufijo: sucursal.codigoPersonalizable?.replace(/^SUC-/, '') ?? undefined,
      telefono: sucursal.telefono ?? undefined,
      email: sucursal.email ?? undefined,
      calle: sucursal.calle,
      numeroExterior: sucursal.numeroExterior,
      numeroInterior: sucursal.numeroInterior ?? undefined,
      colonia: sucursal.colonia,
      municipio: sucursal.municipio,
      estado: sucursal.estado,
      codigoPostal: sucursal.codigoPostal,
    },
  });

  const [calle, numeroExterior, numeroInterior, colonia, municipio, estado, codigoPostal] = useWatch({
    control: form.control,
    name: ['calle', 'numeroExterior', 'numeroInterior', 'colonia', 'municipio', 'estado', 'codigoPostal'],
  });
  const direccionCompleta = buildDireccionCompleta({
    calle: calle ?? '',
    numeroExterior: numeroExterior ?? '',
    numeroInterior: numeroInterior || undefined,
    colonia: colonia ?? '',
    municipio: municipio ?? '',
    estado: estado ?? '',
    codigoPostal: codigoPostal ?? '',
  });

  function onSubmit(values: ActualizarSucursalOutput) {
    const { codigoSufijo, email, telefono, ...direccionFields } = values;
    actualizarSucursal.mutate(
      {
        id: sucursal.id,
        payload: {
          ...direccionFields,
          direccionCompleta,
          codigoPersonalizable: codigoSufijo ? `SUC-${codigoSufijo}` : undefined,
          telefono: telefono || undefined,
          email: email || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Cambios guardados');
          onSaved();
        },
        onError: (error) => {
          const mapped = applySucursalApiError(error, form.setError);
          if (!mapped) toast.error(error.message);
        },
      }
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wide text-foreground-secondary">Datos generales</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <Input label="Nombre" error={form.formState.errors.nombre?.message} {...form.register('nombre')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SucursalCodigoInput error={form.formState.errors.codigoSufijo?.message} {...form.register('codigoSufijo')} />
          <Input label="Teléfono" error={form.formState.errors.telefono?.message} {...form.register('telefono')} />
          <Input label="Email" type="email" error={form.formState.errors.email?.message} {...form.register('email')} />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wide text-foreground-secondary">Dirección</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Input label="Calle" error={form.formState.errors.calle?.message} {...form.register('calle')} />
          </div>
          <Input
            label="Núm. exterior"
            error={form.formState.errors.numeroExterior?.message}
            {...form.register('numeroExterior')}
          />
          <Input
            label="Núm. interior"
            error={form.formState.errors.numeroInterior?.message}
            {...form.register('numeroInterior')}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Colonia" error={form.formState.errors.colonia?.message} {...form.register('colonia')} />
          <Input label="Municipio" error={form.formState.errors.municipio?.message} {...form.register('municipio')} />
          <Input label="Estado" error={form.formState.errors.estado?.message} {...form.register('estado')} />
        </div>
        <div className="sm:w-48">
          <Input
            label="Código postal"
            inputMode="numeric"
            maxLength={5}
            error={form.formState.errors.codigoPostal?.message}
            {...form.register('codigoPostal')}
          />
        </div>
        {direccionCompleta && (
          <p className="text-sm text-foreground-secondary">
            <span className="font-medium text-foreground-muted">Dirección completa: </span>
            {direccionCompleta}
          </p>
        )}
      </fieldset>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" isLoading={actualizarSucursal.isPending} loadingText="Guardando...">
          <SaveIcon className="h-4 w-4" />
          Guardar
        </Button>
      </div>
    </form>
  );
}
