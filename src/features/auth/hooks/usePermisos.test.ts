import { describe, expect, it } from 'vitest';
import { tieneAccion, tieneModuloActivo } from './usePermisos';
import type { ModuloEfectivo } from '../types/permisos.types';

const modulos: ModuloEfectivo[] = [
  {
    modulo: 'modulo.ventas',
    activo: true,
    soloAdmin: false,
    fuenteModulo: 'plan',
    esOverrideModulo: false,
    acciones: [{ clave: 'ventas.crear', permitido: true, fuente: 'rolEmpresa', esOverride: false }],
  },
  {
    modulo: 'modulo.inventario',
    activo: false,
    soloAdmin: false,
    fuenteModulo: 'plan',
    esOverrideModulo: false,
    acciones: [{ clave: 'inventario.editar', permitido: false, fuente: 'plan', esOverride: false }],
  },
];

describe('tieneModuloActivo — spec:SPEC-007:REQ-U3', () => {
  it('true si el módulo existe y está activo', () => {
    expect(tieneModuloActivo(modulos, 'modulo.ventas')).toBe(true);
  });

  it('false si el módulo existe pero está inactivo', () => {
    expect(tieneModuloActivo(modulos, 'modulo.inventario')).toBe(false);
  });

  it('false si el módulo no aparece en la lista', () => {
    expect(tieneModuloActivo(modulos, 'modulo.clientes')).toBe(false);
  });

  // spec:SPEC-007:REQ-X1/X2 — fail-closed cuando aún no hay datos (loading/error)
  it('false cuando modulos es undefined', () => {
    expect(tieneModuloActivo(undefined, 'modulo.ventas')).toBe(false);
  });
});

describe('tieneAccion — spec:SPEC-007:REQ-U3', () => {
  it('true si la acción existe y está permitida', () => {
    expect(tieneAccion(modulos, 'ventas.crear')).toBe(true);
  });

  it('false si la acción existe pero no está permitida', () => {
    expect(tieneAccion(modulos, 'inventario.editar')).toBe(false);
  });

  it('false si la acción no aparece en ningún módulo', () => {
    expect(tieneAccion(modulos, 'clientes.eliminar')).toBe(false);
  });

  // spec:SPEC-007:REQ-X1/X2
  it('false cuando modulos es undefined', () => {
    expect(tieneAccion(undefined, 'ventas.crear')).toBe(false);
  });
});
