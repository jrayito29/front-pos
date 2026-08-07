import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SucursalEstadoControl } from '../../../src/features/sucursales/components/SucursalEstadoControl';
import * as useCambiarEstadoSucursalModule from '../../../src/features/sucursales/hooks/useCambiarEstadoSucursal';
import type { SucursalDTO } from '../../../src/features/sucursales/types/sucursal.types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mutateMock = vi.fn();

function mockHook() {
  vi.spyOn(useCambiarEstadoSucursalModule, 'useCambiarEstadoSucursal').mockReturnValue({
    mutate: mutateMock,
    isPending: false,
  } as unknown as ReturnType<typeof useCambiarEstadoSucursalModule.useCambiarEstadoSucursal>);
}

function sucursalActiva(): SucursalDTO {
  return {
    id: 'suc-1',
    nombre: 'Sucursal Centro',
    codigoInterno: 'SUC-0001',
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

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('SucursalEstadoControl', () => {
  // spec:SPEC-012:REQ-S2
  it('sin permiso de cambiar estado, muestra solo el badge de solo lectura (sin Switch)', () => {
    mockHook();
    render(<SucursalEstadoControl sucursal={sucursalActiva()} puedeCambiarEstado={false} />);

    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  // spec:SPEC-012:REQ-E4 — sin `requiereConfirmacion` en la respuesta, se aplica de inmediato
  it('desactivar sin almacenes con stock aplica el cambio de inmediato, sin modal', async () => {
    mockHook();
    mutateMock.mockImplementation((_vars, options) => options.onSuccess({ ...sucursalActiva(), activo: false }));
    const user = userEvent.setup();
    render(<SucursalEstadoControl sucursal={sucursalActiva()} puedeCambiarEstado />);

    await user.click(screen.getByRole('switch', { name: 'Sucursal activa' }));

    expect(mutateMock).toHaveBeenCalledWith(
      { id: 'suc-1', activo: false },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
    expect(screen.queryByText('Sucursal con almacenes en stock')).not.toBeInTheDocument();
  });

  // spec:SPEC-012:REQ-E4 — con `requiereConfirmacion: true`, se abre el modal listando los almacenes
  it('desactivar con almacenes en stock abre el modal de confirmación con la lista de almacenes', async () => {
    mockHook();
    mutateMock.mockImplementation((_vars, options) =>
      options.onSuccess({
        requiereConfirmacion: true,
        motivo: 'ERR_ALMACENES_CON_STOCK',
        almacenesConStock: [{ id: 'alm-1', nombre: 'Almacén de Ventas', codigoInterno: 'ALM-0001' }],
      })
    );
    const user = userEvent.setup();
    render(<SucursalEstadoControl sucursal={sucursalActiva()} puedeCambiarEstado />);

    await user.click(screen.getByRole('switch', { name: 'Sucursal activa' }));

    expect(await screen.findByText('Sucursal con almacenes en stock')).toBeInTheDocument();
    expect(screen.getByText('Almacén de Ventas', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/ALM-0001/)).toBeInTheDocument();
    expect(mutateMock).toHaveBeenCalledTimes(1);
  });

  // spec:SPEC-012:REQ-E4 — confirmar el modal reenvía con confirmarConStock: true
  it('confirmar el modal reenvía la mutación con confirmarConStock: true', async () => {
    mockHook();
    mutateMock.mockImplementation((_vars, options) => {
      if ('confirmarConStock' in _vars && _vars.confirmarConStock) {
        options.onSuccess({ ...sucursalActiva(), activo: false });
        return;
      }
      options.onSuccess({
        requiereConfirmacion: true,
        motivo: 'ERR_ALMACENES_CON_STOCK',
        almacenesConStock: [{ id: 'alm-1', nombre: 'Almacén de Ventas', codigoInterno: 'ALM-0001' }],
      });
    });
    const user = userEvent.setup();
    render(<SucursalEstadoControl sucursal={sucursalActiva()} puedeCambiarEstado />);

    await user.click(screen.getByRole('switch', { name: 'Sucursal activa' }));
    await user.click(await screen.findByRole('button', { name: 'Confirmar y desactivar' }));

    expect(mutateMock).toHaveBeenLastCalledWith(
      { id: 'suc-1', activo: false, confirmarConStock: true },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  // spec:SPEC-012:REQ-X6 — cerrar el modal sin confirmar no ejecuta una segunda mutación
  it('cancelar el modal de confirmación no ejecuta una segunda mutación', async () => {
    mockHook();
    mutateMock.mockImplementation((_vars, options) =>
      options.onSuccess({
        requiereConfirmacion: true,
        motivo: 'ERR_ALMACENES_CON_STOCK',
        almacenesConStock: [{ id: 'alm-1', nombre: 'Almacén de Ventas', codigoInterno: 'ALM-0001' }],
      })
    );
    const user = userEvent.setup();
    render(<SucursalEstadoControl sucursal={sucursalActiva()} puedeCambiarEstado />);

    await user.click(screen.getByRole('switch', { name: 'Sucursal activa' }));
    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));

    // Solo 1 llamada (la que abrió el modal) — cancelar no dispara una segunda mutación. No se
    // afirma la desaparición inmediata del modal: Modal.tsx permanece montado durante su animación
    // de salida (EXIT_DURATION_MS), así que el texto puede seguir presente por un instante.
    expect(mutateMock).toHaveBeenCalledTimes(1);
  });

  // spec:SPEC-012:REQ-E5 — reactivar nunca pasa por el modal de confirmación
  it('reactivar una sucursal inactiva se aplica de inmediato, sin modal', async () => {
    mockHook();
    mutateMock.mockImplementation((_vars, options) => options.onSuccess({ ...sucursalActiva(), activo: true }));
    const user = userEvent.setup();
    const inactiva: SucursalDTO = { ...sucursalActiva(), activo: false };
    render(<SucursalEstadoControl sucursal={inactiva} puedeCambiarEstado />);

    await user.click(screen.getByRole('switch', { name: 'Sucursal activa' }));

    expect(mutateMock).toHaveBeenCalledWith(
      { id: 'suc-1', activo: true },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
    expect(screen.queryByText('Sucursal con almacenes en stock')).not.toBeInTheDocument();
  });
});
