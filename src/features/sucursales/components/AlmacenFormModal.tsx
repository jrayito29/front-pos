import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { RefObject } from 'react';
import { Modal } from '../../../components/Modal';
import { Input } from '../../../components/Input';
import { Switch } from '../../../components/Switch';
import { Button } from '../../../components/Button';
import { SaveIcon } from '../../../components/icons';
import { TipoAlmacenBadge } from './TipoAlmacenBadge';
import { AlmacenEstadoControl } from './AlmacenEstadoControl';
import { AlmacenDireccionFields } from './AlmacenDireccionFields';
import { buildDireccionCompleta } from '../../../lib/buildDireccionCompleta';
import { crearAlmacenSchema, type CrearAlmacenInput, type CrearAlmacenOutput } from '../schemas/crearAlmacen.schema';
import { useCrearAlmacen } from '../hooks/useCrearAlmacen';
import { useActualizarAlmacen } from '../hooks/useActualizarAlmacen';
import { applyAlmacenApiError } from '../hooks/applyAlmacenApiError';
import { TIPO_ALMACEN } from '../constants/sucursal.constants';
import type { AlmacenDTO } from '../types/sucursal.types';

interface AlmacenFormModalProps {
  isOpen: boolean;
  mode: 'crear' | 'editar';
  sucursalId: string;
  almacen?: AlmacenDTO | null;
  puedeCambiarEstado: boolean;
  onClose: () => void;
  onSaved: (almacen: AlmacenDTO) => void;
  originRef?: RefObject<HTMLElement | null>;
}

function buildPayload(values: CrearAlmacenOutput) {
  const tieneDireccion = Boolean(
    values.calle || values.numeroExterior || values.colonia || values.municipio || values.estado || values.codigoPostal
  );

  return {
    nombre: values.nombre,
    codigoPersonalizable: values.codigoPersonalizable || undefined,
    permitirVenta: values.permitirVenta,
    permitirTraspaso: values.permitirTraspaso,
    esVirtual: values.esVirtual,
    ...(tieneDireccion && {
      calle: values.calle,
      numeroExterior: values.numeroExterior,
      numeroInterior: values.numeroInterior || undefined,
      colonia: values.colonia,
      municipio: values.municipio,
      estado: values.estado,
      codigoPostal: values.codigoPostal,
      direccionCompleta: buildDireccionCompleta({
        calle: values.calle ?? '',
        numeroExterior: values.numeroExterior ?? '',
        numeroInterior: values.numeroInterior || undefined,
        colonia: values.colonia ?? '',
        municipio: values.municipio ?? '',
        estado: values.estado ?? '',
        codigoPostal: values.codigoPostal ?? '',
      }),
    }),
  };
}

// SPEC-012 REQ-E6/E7 — modal único de crear/editar (mismo criterio que CategoriaFormModal). `tipo`
// nunca es un campo del formulario: en crear siempre es PERSONALIZADO (fijo por el backend); en
// editar se muestra como badge de solo lectura (inmutable).
export function AlmacenFormModal({
  isOpen,
  mode,
  sucursalId,
  almacen,
  puedeCambiarEstado,
  onClose,
  onSaved,
  originRef,
}: AlmacenFormModalProps) {
  const crearAlmacen = useCrearAlmacen();
  const actualizarAlmacen = useActualizarAlmacen();
  const isPending = crearAlmacen.isPending || actualizarAlmacen.isPending;

  const form = useForm<CrearAlmacenInput, unknown, CrearAlmacenOutput>({ resolver: zodResolver(crearAlmacenSchema) });

  useEffect(() => {
    if (!isOpen) return;
    form.reset({
      nombre: almacen?.nombre ?? '',
      codigoPersonalizable: almacen?.codigoPersonalizable ?? undefined,
      permitirVenta: almacen?.permitirVenta ?? false,
      permitirTraspaso: almacen?.permitirTraspaso ?? false,
      esVirtual: almacen?.esVirtual ?? false,
      calle: almacen?.calle ?? undefined,
      numeroExterior: almacen?.numeroExterior ?? undefined,
      numeroInterior: almacen?.numeroInterior ?? undefined,
      colonia: almacen?.colonia ?? undefined,
      municipio: almacen?.municipio ?? undefined,
      estado: almacen?.estado ?? undefined,
      codigoPostal: almacen?.codigoPostal ?? undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `form` se asume estable por invocación de useForm; solo debe re-ejecutar cuando `isOpen`/`almacen` cambian
  }, [isOpen, almacen]);

  function onSubmit(values: CrearAlmacenOutput) {
    const payload = buildPayload(values);

    if (mode === 'crear') {
      crearAlmacen.mutate(
        { sucursalId, payload },
        {
          onSuccess: (creado) => {
            toast.success('Almacén creado');
            onSaved(creado);
            onClose();
          },
          onError: (error) => {
            const mapped = applyAlmacenApiError(error, form.setError);
            if (!mapped) toast.error(error.message);
          },
        }
      );
      return;
    }

    if (!almacen) return;
    actualizarAlmacen.mutate(
      { id: almacen.id, payload },
      {
        onSuccess: (actualizado) => {
          toast.success('Almacén actualizado');
          onSaved(actualizado);
          onClose();
        },
        onError: (error) => {
          const mapped = applyAlmacenApiError(error, form.setError);
          if (!mapped) toast.error(error.message);
        },
      }
    );
  }

  const tipoMostrado = mode === 'crear' ? TIPO_ALMACEN.PERSONALIZADO : (almacen?.tipo ?? TIPO_ALMACEN.PERSONALIZADO);
  const direccionYaExiste = Boolean(almacen?.calle || almacen?.colonia || almacen?.municipio);

  return (
    <Modal
      isOpen={isOpen}
      title={mode === 'crear' ? 'Nuevo almacén' : `Editar ${almacen?.nombre ?? 'almacén'}`}
      onClose={onClose}
      originRef={originRef}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <TipoAlmacenBadge tipo={tipoMostrado} />
          {mode === 'editar' && almacen && (
            <AlmacenEstadoControl almacen={almacen} puedeCambiarEstado={puedeCambiarEstado} />
          )}
        </div>

        <Input label="Nombre" required error={form.formState.errors.nombre?.message} {...form.register('nombre')} />
        <Input
          label="Código personalizado (opcional)"
          error={form.formState.errors.codigoPersonalizable?.message}
          {...form.register('codigoPersonalizable')}
        />

        <div className="flex flex-col gap-2.5">
          <Controller
            control={form.control}
            name="permitirVenta"
            render={({ field }) => <Switch label="Permite venta" checked={field.value ?? false} onChange={field.onChange} />}
          />
          <Controller
            control={form.control}
            name="permitirTraspaso"
            render={({ field }) => (
              <Switch label="Permite traspaso" checked={field.value ?? false} onChange={field.onChange} />
            )}
          />
          <Controller
            control={form.control}
            name="esVirtual"
            render={({ field }) => (
              <Switch label="Es virtual (sin ubicación física)" checked={field.value ?? false} onChange={field.onChange} />
            )}
          />
        </div>

        <AlmacenDireccionFields
          key={mode === 'editar' ? (almacen?.id ?? 'editar') : 'crear'}
          register={form.register}
          errors={form.formState.errors}
          initiallyOpen={direccionYaExiste}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" isLoading={isPending} loadingText="Guardando...">
            <SaveIcon className="h-4 w-4" />
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
