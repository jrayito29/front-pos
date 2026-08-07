import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { SucursalCrearForm } from '../../../src/features/sucursales/components/SucursalCrearForm';
import * as useCrearSucursalModule from '../../../src/features/sucursales/hooks/useCrearSucursal';
import { ROUTES } from '../../../src/constants/routes';
import type { SucursalDTO } from '../../../src/features/sucursales/types/sucursal.types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mutateMock = vi.fn();

function mockHook() {
  vi.spyOn(useCrearSucursalModule, 'useCrearSucursal').mockReturnValue({
    mutate: mutateMock,
    isPending: false,
  } as unknown as ReturnType<typeof useCrearSucursalModule.useCrearSucursal>);
}

function sucursalCreada(): SucursalDTO {
  return {
    id: 'suc-nueva',
    nombre: 'Sucursal Centro',
    codigoInterno: 'SUC-0002',
    codigoPersonalizable: null,
    telefono: null,
    email: null,
    calle: 'Av. Juárez',
    numeroExterior: '123',
    numeroInterior: null,
    colonia: 'Centro',
    municipio: 'Monterrey',
    estado: 'Nuevo León',
    codigoPostal: '64000',
    direccionCompleta: 'Av. Juárez 123, Col. Centro, Monterrey, Nuevo León 64000',
    activo: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };
}

function renderForm() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.SUCURSALES_NUEVO]}>
      <SucursalCrearForm />
    </MemoryRouter>
  );
}

async function llenarCamposRequeridos(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre', { exact: false }), 'Sucursal Centro');
  await user.type(screen.getByLabelText('Calle', { exact: false }), 'Av. Juárez');
  await user.type(screen.getByLabelText('Núm. exterior', { exact: false }), '123');
  await user.type(screen.getByLabelText('Colonia', { exact: false }), 'Centro');
  await user.type(screen.getByLabelText('Municipio', { exact: false }), 'Monterrey');
  await user.type(screen.getByLabelText('Estado', { exact: false }), 'Nuevo León');
  await user.type(screen.getByLabelText('Código postal', { exact: false }), '64000');
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('SucursalCrearForm', () => {
  // spec:SPEC-012:REQ-U8
  it('muestra Ventas/Mermas/Tránsito fijos y deshabilitados, y Reserva/Apartados editables', () => {
    mockHook();
    renderForm();

    const ventas = screen.getByRole('switch', { name: 'Almacén de Ventas' });
    const mermas = screen.getByRole('switch', { name: 'Almacén de Mermas y Devoluciones' });
    const transito = screen.getByRole('switch', { name: 'Almacén de Tránsito' });
    [ventas, mermas, transito].forEach((sw) => {
      expect(sw).toHaveAttribute('aria-checked', 'true');
      expect(sw).toBeDisabled();
    });

    const reserva = screen.getByRole('switch', { name: 'Bodega de Reserva' });
    const apartados = screen.getByRole('switch', { name: 'Almacén de Apartados' });
    [reserva, apartados].forEach((sw) => {
      expect(sw).toHaveAttribute('aria-checked', 'false');
      expect(sw).not.toBeDisabled();
    });
  });

  // spec:SPEC-012:REQ-U4 — prefijo visual fijo "SUC-", el usuario solo captura el sufijo
  it('muestra el prefijo visual "SUC-" junto al campo de código', () => {
    mockHook();
    renderForm();

    expect(screen.getByText('SUC-')).toBeInTheDocument();
  });

  // spec:SPEC-012:REQ-U5/E10 — direccionCompleta se ofrece como sugerencia clickeable a medida que
  // se llenan los campos, sin sobreescribir el input editable
  it('calcula y ofrece la dirección completa como sugerencia clickeable a medida que se llenan los campos', async () => {
    mockHook();
    const user = userEvent.setup();
    renderForm();

    expect(screen.queryByLabelText('Dirección completa', { exact: false })).not.toBeInTheDocument();

    await llenarCamposRequeridos(user);

    expect(
      screen.getByRole('button', { name: 'Sugerencia: "Av. Juárez 123, Col. Centro, Monterrey, Nuevo León 64000" — usar' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Dirección completa', { exact: false })).toHaveValue('');
  });

  // spec:SPEC-012:REQ-U5 — el usuario puede reescribir la dirección completa sugerida
  it('permite reescribir la dirección completa y la envía tal como el usuario la dejó', async () => {
    mockHook();
    mutateMock.mockImplementation((_payload, options) => options.onSuccess(sucursalCreada()));
    const user = userEvent.setup();
    renderForm();

    await llenarCamposRequeridos(user);
    await user.type(screen.getByLabelText('Dirección completa', { exact: false }), 'Av. Juárez #123, Centro, Monterrey');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(mutateMock).toHaveBeenCalledWith(
      expect.objectContaining({ direccionCompleta: 'Av. Juárez #123, Centro, Monterrey' }),
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  // spec:SPEC-012:REQ-U4/U5/U8 — payload completo en el submit, usando la sugerencia calculada como fallback
  it('al guardar sin reescribir la dirección, envía direccionCompleta calculada, código con prefijo "SUC-" y almacenesOpcionales', async () => {
    mockHook();
    mutateMock.mockImplementation((_payload, options) => options.onSuccess(sucursalCreada()));
    const user = userEvent.setup();
    renderForm();

    await llenarCamposRequeridos(user);
    await user.type(screen.getByLabelText('Código (opcional)'), 'CENTRO');
    await user.click(screen.getByRole('switch', { name: 'Bodega de Reserva' }));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(mutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Sucursal Centro',
        calle: 'Av. Juárez',
        numeroExterior: '123',
        colonia: 'Centro',
        municipio: 'Monterrey',
        estado: 'Nuevo León',
        codigoPostal: '64000',
        direccionCompleta: 'Av. Juárez 123, Col. Centro, Monterrey, Nuevo León 64000',
        codigoPersonalizable: 'SUC-CENTRO',
        almacenesOpcionales: { incluirReserva: true, incluirApartados: false },
      }),
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  // spec:SPEC-012:REQ-X4
  it('código duplicado: ancla el error al campo de código en vez de mostrar solo un toast', async () => {
    mockHook();
    mutateMock.mockImplementation((_payload, options) =>
      options.onError({ code: 'ERR_SUCURSAL_CODIGO_DUPLICADO', message: 'Ya existe una sucursal con ese código' })
    );
    const user = userEvent.setup();
    renderForm();

    await llenarCamposRequeridos(user);
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Ya existe una sucursal con ese código')).toBeInTheDocument();
  });
});
