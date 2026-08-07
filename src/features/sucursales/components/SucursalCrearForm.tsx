import { FormProvider, useForm, useWatch } from 'react-hook-form';
import type { ChangeEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { SaveIcon } from '../../../components/icons';
import { SucursalCodigoInput } from './SucursalCodigoInput';
import { SucursalDireccionFields } from './SucursalDireccionFields';
import { SucursalAlmacenesOpcionalesFields } from './SucursalAlmacenesOpcionalesFields';
import { buildDireccionCompleta } from '../../../lib/buildDireccionCompleta';
import { sucursalDetalleRoute, ROUTES } from '../../../constants/routes';
import { crearSucursalSchema, type CrearSucursalInput, type CrearSucursalOutput } from '../schemas/crearSucursal.schema';
import { useCrearSucursal } from '../hooks/useCrearSucursal';
import { applySucursalApiError } from '../hooks/applySucursalApiError';

// Mismo criterio que StepDatosPersonales (auth) — bloquea letras/signos en tiempo real; el Zod
// schema sigue siendo la fuente de verdad para el formato final (10 dígitos).
function sanitizeTelefonoInput(event: ChangeEvent<HTMLInputElement>) {
  event.target.value = event.target.value.replace(/[^\d\s-]/g, '');
}

// SPEC-012 REQ-U2/U8 — formulario de creación completo (datos generales, dirección, almacenes que
// se crearán), organizado en secciones delimitadas por línea — mismo criterio visual que
// ProductoCrearForm.
export function SucursalCrearForm() {
  const navigate = useNavigate();
  const crearSucursal = useCrearSucursal();

  const form = useForm<CrearSucursalInput, unknown, CrearSucursalOutput>({
    resolver: zodResolver(crearSucursalSchema),
    defaultValues: { incluirReserva: false, incluirApartados: false },
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

  function onSubmit(values: CrearSucursalOutput) {
    const { codigoSufijo, incluirReserva, incluirApartados, email, telefono, ...direccionFields } = values;

    crearSucursal.mutate(
      {
        ...direccionFields,
        direccionCompleta,
        codigoPersonalizable: codigoSufijo ? `SUC-${codigoSufijo}` : undefined,
        telefono: telefono || undefined,
        email: email || undefined,
        almacenesOpcionales: { incluirReserva, incluirApartados },
      },
      {
        onSuccess: (sucursal) => {
          toast.success('Sucursal creada', {
            action: { label: 'Ir al listado', onClick: () => navigate(ROUTES.SUCURSALES) },
          });
          navigate(sucursalDetalleRoute(sucursal.id));
        },
        onError: (error) => {
          const mapped = applySucursalApiError(error, form.setError);
          if (!mapped) toast.error(error.message);
        },
      }
    );
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6 rounded-lg border border-border bg-background p-6 shadow-sm"
      >
        <fieldset className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wide text-foreground-secondary">Datos generales</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <Input label="Nombre" required error={form.formState.errors.nombre?.message} {...form.register('nombre')} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SucursalCodigoInput error={form.formState.errors.codigoSufijo?.message} {...form.register('codigoSufijo')} />
            {/* <Input label="Teléfono" error={form.formState.errors.telefono?.message} {...form.register('telefono')} />
             */}
            <Input
              label="Teléfono"
              type="tel"
              inputMode="numeric"
              maxLength={12}
              error={form.formState.errors.telefono?.message}
              {...form.register('telefono', { onChange: sanitizeTelefonoInput })}
            />
            <Input label="Email" type="email" error={form.formState.errors.email?.message} {...form.register('email')} />
          </div>
        </fieldset>

        <SucursalDireccionFields direccionCompleta={direccionCompleta} />

        <SucursalAlmacenesOpcionalesFields />

        <div className="flex items-center justify-between gap-4 pt-2">
          <p className="text-xs text-foreground-muted">
            <span className="text-brand-coral-text">*</span> Campos requeridos
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => navigate(ROUTES.SUCURSALES)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" isLoading={crearSucursal.isPending} loadingText="Guardando...">
              <SaveIcon className="h-4 w-4" />
              Guardar
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
