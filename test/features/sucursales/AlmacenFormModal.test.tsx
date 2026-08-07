import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlmacenFormModal } from '../../../src/features/sucursales/components/AlmacenFormModal';
import * as useCrearAlmacenModule from '../../../src/features/sucursales/hooks/useCrearAlmacen';
import * as useActualizarAlmacenModule from '../../../src/features/sucursales/hooks/useActualizarAlmacen';
import * as useCambiarEstadoAlmacenModule from '../../../src/features/sucursales/hooks/useCambiarEstadoAlmacen';
import type { AlmacenDTO } from '../../../src/features/sucursales/types/sucursal.types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const crearMutateMock = vi.fn();
const actualizarMutateMock = vi.fn();
const cambiarEstadoMutateMock = vi.fn();

function mockHooks() {
  vi.spyOn(useCrearAlmacenModule, 'useCrearAlmacen').mockReturnValue({
    mutate: crearMutateMock,
    isPending: false,
  } as unknown as ReturnType<typeof useCrearAlmacenModule.useCrearAlmacen>);
  vi.spyOn(useActualizarAlmacenModule, 'useActualizarAlmacen').mockReturnValue({
    mutate: actualizarMutateMock,
    isPending: false,
  } as unknown as ReturnType<typeof useActualizarAlmacenModule.useActualizarAlmacen>);
  vi.spyOn(useCambiarEstadoAlmacenModule, 'useCambiarEstadoAlmacen').mockReturnValue({
    mutate: cambiarEstadoMutateMock,
    isPending: false,
  } as unknown as ReturnType<typeof useCambiarEstadoAlmacenModule.useCambiarEstadoAlmacen>);
}

function almacenPersonalizado(): AlmacenDTO {
  return {
    id: 'alm-9',
    nombre: 'Bodega Externa',
    tipo: 'RESERVA',
    codigoInterno: 'ALM-0009',
    codigoPersonalizable: 'BODEGA-EXT',
    permitirVenta: false,
    permitirTraspaso: false,
    esVirtual: false,
    activo: true,
    sucursalId: 'suc-1',
    empresaId: 'empresa-1',
    calle: 'Av. Juárez',
    numeroExterior: '123',
    numeroInterior: null,
    colonia: 'Centro',
    municipio: 'Monterrey',
    estado: 'Nuevo León',
    codigoPostal: '64000',
    direccionCompleta: 'Av. Juárez 123, Col. Centro, Monterrey, Nuevo León 64000',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('AlmacenFormModal', () => {
  // spec:SPEC-012:REQ-E7
  it('modo crear: título "Nuevo almacén", tipo fijo "Personalizado" y nombre vacío', () => {
    mockHooks();
    render(
      <AlmacenFormModal isOpen mode="crear" sucursalId="suc-1" puedeCambiarEstado onClose={vi.fn()} onSaved={vi.fn()} />
    );

    expect(screen.getByRole('heading', { name: 'Nuevo almacén' })).toBeInTheDocument();
    expect(screen.getByText('Personalizado')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre', { exact: false })).toHaveValue('');
    // No hay control de estado al crear (un almacén nuevo siempre nace activo).
    expect(screen.queryByRole('switch', { name: 'Almacén activo' })).not.toBeInTheDocument();
  });

  // spec:SPEC-012:REQ-E6
  it('modo editar: título con el nombre actual, precarga los datos y muestra el tipo real (inmutable)', () => {
    mockHooks();
    render(
      <AlmacenFormModal
        isOpen
        mode="editar"
        sucursalId="suc-1"
        almacen={almacenPersonalizado()}
        puedeCambiarEstado
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Editar Bodega Externa' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre', { exact: false })).toHaveValue('Bodega Externa');
    expect(screen.getByText('Reserva')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Almacén activo' })).toBeInTheDocument();
  });

  // spec:SPEC-012:REQ-E7 — sin abrir la sección de dirección, el payload no incluye ningún campo de
  // dirección (el backend hereda la de la sucursal).
  it('crear sin abrir la sección de dirección: el payload no incluye campos de dirección', async () => {
    mockHooks();
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const onClose = vi.fn();
    crearMutateMock.mockImplementation((_vars, options) => options.onSuccess(almacenPersonalizado()));

    render(
      <AlmacenFormModal isOpen mode="crear" sucursalId="suc-1" puedeCambiarEstado onClose={onClose} onSaved={onSaved} />
    );
    await user.type(screen.getByLabelText('Nombre', { exact: false }), 'Bodega Trasera');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(crearMutateMock).toHaveBeenCalledWith(
      {
        sucursalId: 'suc-1',
        payload: { nombre: 'Bodega Trasera', codigoPersonalizable: undefined, permitirVenta: false, permitirTraspaso: false, esVirtual: false },
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  // spec:SPEC-012:REQ-E7 — al abrir la sección y completarla, el payload incluye dirección + direccionCompleta calculada
  it('crear con la sección de dirección abierta y completa: el payload incluye dirección y direccionCompleta', async () => {
    mockHooks();
    const user = userEvent.setup();
    crearMutateMock.mockImplementation((_vars, options) => options.onSuccess(almacenPersonalizado()));

    render(
      <AlmacenFormModal isOpen mode="crear" sucursalId="suc-1" puedeCambiarEstado onClose={vi.fn()} onSaved={vi.fn()} />
    );
    await user.type(screen.getByLabelText('Nombre', { exact: false }), 'Bodega Trasera');
    await user.click(screen.getByRole('button', { name: 'Usar una dirección distinta a la de la sucursal' }));
    await user.type(screen.getByLabelText('Calle'), 'Av. Juárez');
    await user.type(screen.getByLabelText('Núm. exterior'), '123');
    await user.type(screen.getByLabelText('Colonia'), 'Centro');
    await user.type(screen.getByLabelText('Municipio'), 'Monterrey');
    await user.type(screen.getByLabelText('Estado'), 'Nuevo León');
    await user.type(screen.getByLabelText('Código postal'), '64000');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(crearMutateMock).toHaveBeenCalledWith(
      {
        sucursalId: 'suc-1',
        payload: expect.objectContaining({
          nombre: 'Bodega Trasera',
          calle: 'Av. Juárez',
          numeroExterior: '123',
          colonia: 'Centro',
          municipio: 'Monterrey',
          estado: 'Nuevo León',
          codigoPostal: '64000',
          direccionCompleta: 'Av. Juárez 123, Col. Centro, Monterrey, Nuevo León 64000',
        }),
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  // spec:SPEC-012:REQ-E6 — editar reenvía la dirección ya cargada, precargada y abierta por defecto
  it('editar sin tocar nada: reenvía id y los valores precargados (incluida la dirección ya existente)', async () => {
    mockHooks();
    const user = userEvent.setup();
    actualizarMutateMock.mockImplementation((_vars, options) => options.onSuccess(almacenPersonalizado()));

    render(
      <AlmacenFormModal
        isOpen
        mode="editar"
        sucursalId="suc-1"
        almacen={almacenPersonalizado()}
        puedeCambiarEstado
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(actualizarMutateMock).toHaveBeenCalledWith(
      {
        id: 'alm-9',
        payload: expect.objectContaining({ nombre: 'Bodega Externa', calle: 'Av. Juárez', colonia: 'Centro' }),
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  // spec:SPEC-012:REQ-X5
  it('código duplicado: ancla el error al campo "Código personalizado" en vez de mostrar solo un toast', async () => {
    mockHooks();
    const user = userEvent.setup();
    crearMutateMock.mockImplementation((_vars, options) =>
      options.onError({ code: 'ERR_ALMACEN_CODIGO_DUPLICADO', message: 'Ya existe un almacén con ese código' })
    );

    render(
      <AlmacenFormModal isOpen mode="crear" sucursalId="suc-1" puedeCambiarEstado onClose={vi.fn()} onSaved={vi.fn()} />
    );
    await user.type(screen.getByLabelText('Nombre', { exact: false }), 'Bodega Trasera');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Ya existe un almacén con ese código')).toBeInTheDocument();
  });

  // spec:SPEC-012:REQ-X6
  it('cerrar el modal (Cancelar) no ejecuta ninguna mutación', async () => {
    mockHooks();
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <AlmacenFormModal isOpen mode="crear" sucursalId="suc-1" puedeCambiarEstado onClose={onClose} onSaved={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(crearMutateMock).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
