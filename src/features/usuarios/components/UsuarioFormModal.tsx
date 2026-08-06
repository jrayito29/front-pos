import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { RefObject } from 'react';
import { Modal } from '../../../components/Modal';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import { Button } from '../../../components/Button';
import { SaveIcon } from '../../../components/icons';
import { crearUsuarioSchema, type CrearUsuarioValues } from '../schemas/crearUsuario.schema';
import { useCrearUsuario } from '../hooks/useCrearUsuario';
import { applyUsuarioApiError } from '../hooks/applyUsuarioApiError';
import { ROLES_ASIGNABLES, USUARIO_ROL_LABEL } from '../constants/usuario.constants';
import type { UsuarioCreadoDTO } from '../types/usuario.types';

const ROL_OPTIONS = ROLES_ASIGNABLES.map((value) => ({ value, label: USUARIO_ROL_LABEL[value] }));

interface UsuarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (usuario: UsuarioCreadoDTO) => void;
  originRef?: RefObject<HTMLElement | null>;
}

// SPEC-011 REQ-U5 — solo crea, sin modo edición: el backend no expone actualización de perfil tras
// el alta (usuarios-gestion.spec.md solo define POST/PATCH :id/rol/DELETE). REQ-E2: al crear con
// éxito NO se muestra un toast de éxito genérico — el llamador (UsuariosListPage) abre
// UsuarioCreadoModal, que ya es la confirmación visual del evento; un toast adicional sería
// redundante sobre el mismo hecho.
export function UsuarioFormModal({ isOpen, onClose, onCreated, originRef }: UsuarioFormModalProps) {
  const crearUsuario = useCrearUsuario();
  const form = useForm<CrearUsuarioValues>({ resolver: zodResolver(crearUsuarioSchema) });

  useEffect(() => {
    if (!isOpen) return;
    form.reset({ email: '', nombre: '', apellidoPaterno: '', apellidoMaterno: '', telefono: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `form` se asume estable por invocación de useForm; solo debe re-ejecutar cuando `isOpen` cambia
  }, [isOpen]);

  function onSubmit(values: CrearUsuarioValues) {
    crearUsuario.mutate(
      {
        email: values.email,
        role: values.role,
        nombre: values.nombre,
        apellidoPaterno: values.apellidoPaterno,
        apellidoMaterno: values.apellidoMaterno || undefined,
        telefono: values.telefono || undefined,
      },
      {
        onSuccess: (creado) => {
          onCreated(creado);
          onClose();
        },
        onError: (error) => {
          const mapped = applyUsuarioApiError(error, form.setError);
          if (!mapped) toast.error(error.message);
        },
      }
    );
  }

  return (
    <Modal isOpen={isOpen} title="Nuevo usuario" onClose={onClose} originRef={originRef}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Email" type="email" required error={form.formState.errors.email?.message} {...form.register('email')} />

        <Controller
          control={form.control}
          name="role"
          render={({ field }) => (
            <Select
              label="Rol"
              required
              options={ROL_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={form.formState.errors.role?.message}
            />
          )}
        />

        <Input label="Nombre" required error={form.formState.errors.nombre?.message} {...form.register('nombre')} />
        <Input
          label="Apellido paterno"
          required
          error={form.formState.errors.apellidoPaterno?.message}
          {...form.register('apellidoPaterno')}
        />
        <Input label="Apellido materno" error={form.formState.errors.apellidoMaterno?.message} {...form.register('apellidoMaterno')} />
        <Input label="Teléfono" type="tel" error={form.formState.errors.telefono?.message} {...form.register('telefono')} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" isLoading={crearUsuario.isPending} loadingText="Creando...">
            <SaveIcon className="h-4 w-4" />
            Crear
          </Button>
        </div>
      </form>
    </Modal>
  );
}
