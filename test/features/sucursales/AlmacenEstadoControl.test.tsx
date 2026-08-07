import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { AlmacenEstadoControl } from '../../../src/features/sucursales/components/AlmacenEstadoControl';
import * as useCambiarEstadoAlmacenModule from '../../../src/features/sucursales/hooks/useCambiarEstadoAlmacen';
import type { AlmacenDTO } from '../../../src/features/sucursales/types/sucursal.types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mutateMock = vi.fn();

function mockHook() {
  vi.spyOn(useCambiarEstadoAlmacenModule, 'useCambiarEstadoAlmacen').mockReturnValue({
    mutate: mutateMock,
    isPending: false,
  } as unknown as ReturnType<typeof useCambiarEstadoAlmacenModule.useCambiarEstadoAlmacen>);
}

function almacenActivo(): AlmacenDTO {
  return {
    id: 'alm-1',
    nombre: 'Almacén de Ventas',
    tipo: 'VENTAS',
    codigoInterno: 'ALM-0001',
    codigoPersonalizable: null,
    permitirVenta: true,
    permitirTraspaso: true,
    esVirtual: false,
    activo: true,
    sucursalId: 'suc-1',
    empresaId: 'empresa-1',
    calle: null,
    numeroExterior: null,
    numeroInterior: null,
    colonia: null,
    municipio: null,
    estado: null,
    codigoPostal: null,
    direccionCompleta: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('AlmacenEstadoControl', () => {
  // spec:SPEC-012:REQ-S3
  it('sin permiso de cambiar estado, muestra solo el badge de solo lectura (sin Switch)', () => {
    mockHook();
    render(<AlmacenEstadoControl almacen={almacenActivo()} puedeCambiarEstado={false} />);

    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('cambiar el switch llama a la mutación con el id y el nuevo estado', async () => {
    mockHook();
    mutateMock.mockImplementation((_vars, options) => options.onSuccess({ ...almacenActivo(), activo: false }));
    const user = userEvent.setup();
    render(<AlmacenEstadoControl almacen={almacenActivo()} puedeCambiarEstado />);

    await user.click(screen.getByRole('switch', { name: 'Almacén activo' }));

    expect(mutateMock).toHaveBeenCalledWith(
      { id: 'alm-1', activo: false },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
    expect(toast.success).toHaveBeenCalledWith('Estado actualizado');
  });

  // spec:SPEC-012:REQ-E8 — a diferencia de Sucursal, no hay modal de confirmación previa: un 409
  // ERR_ALMACEN_CON_STOCK se muestra directo vía toast.
  it('si la mutación falla con ERR_ALMACEN_CON_STOCK, muestra el error vía toast (sin modal)', async () => {
    mockHook();
    mutateMock.mockImplementation((_vars, options) =>
      options.onError({ code: 'ERR_ALMACEN_CON_STOCK', message: 'El almacén tiene stock; no se puede desactivar' })
    );
    const user = userEvent.setup();
    render(<AlmacenEstadoControl almacen={almacenActivo()} puedeCambiarEstado />);

    await user.click(screen.getByRole('switch', { name: 'Almacén activo' }));

    expect(toast.error).toHaveBeenCalledWith('El almacén tiene stock; no se puede desactivar');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
