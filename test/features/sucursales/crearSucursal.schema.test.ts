import { describe, expect, it } from 'vitest';
import { crearSucursalSchema } from '../../../src/features/sucursales/schemas/crearSucursal.schema';

const payloadValido = {
  nombre: 'Sucursal Centro',
  calle: 'Av. Juárez',
  numeroExterior: '123',
  colonia: 'Centro',
  municipio: 'Monterrey',
  estado: 'Nuevo León',
  codigoPostal: '64000',
};

describe('crearSucursalSchema', () => {
  it('acepta un payload válido completo', () => {
    expect(crearSucursalSchema.safeParse(payloadValido).success).toBe(true);
  });

  it.each(['nombre', 'calle', 'numeroExterior', 'colonia', 'municipio', 'estado', 'codigoPostal'])(
    'rechaza cuando falta el campo requerido "%s"',
    (campo) => {
      const { [campo]: _omitido, ...incompleto } = payloadValido;
      expect(crearSucursalSchema.safeParse(incompleto).success).toBe(false);
    }
  );

  it('rechaza codigoPostal que no tenga exactamente 5 caracteres', () => {
    expect(crearSucursalSchema.safeParse({ ...payloadValido, codigoPostal: '640' }).success).toBe(false);
    expect(crearSucursalSchema.safeParse({ ...payloadValido, codigoPostal: '6400099' }).success).toBe(false);
  });

  // spec:SPEC-012:REQ-U4 — codigoSufijo NUNCA incluye el prefijo "SUC-" (se concatena en el submit
  // del formulario, no aquí); el schema solo valida el sufijo libre.
  describe('codigoSufijo (REQ-U4)', () => {
    it('acepta un sufijo sin el prefijo "SUC-"', () => {
      const result = crearSucursalSchema.safeParse({ ...payloadValido, codigoSufijo: 'CENTRO' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.codigoSufijo).toBe('CENTRO');
    });

    it('es opcional — un payload sin codigoSufijo sigue siendo válido', () => {
      expect(crearSucursalSchema.safeParse(payloadValido).success).toBe(true);
    });

    it('rechaza un sufijo de más de 16 caracteres', () => {
      const result = crearSucursalSchema.safeParse({ ...payloadValido, codigoSufijo: 'X'.repeat(17) });
      expect(result.success).toBe(false);
    });
  });

  describe('email', () => {
    it('acepta string vacío (campo no capturado)', () => {
      expect(crearSucursalSchema.safeParse({ ...payloadValido, email: '' }).success).toBe(true);
    });

    it('acepta un email válido', () => {
      expect(crearSucursalSchema.safeParse({ ...payloadValido, email: 'centro@empresa.com' }).success).toBe(true);
    });

    it('rechaza un email con formato inválido', () => {
      expect(crearSucursalSchema.safeParse({ ...payloadValido, email: 'no-es-un-email' }).success).toBe(false);
    });
  });

  // spec:SPEC-012:REQ-U8
  describe('incluirReserva / incluirApartados', () => {
    it('por defecto son false cuando no se envían', () => {
      const result = crearSucursalSchema.safeParse(payloadValido);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.incluirReserva).toBe(false);
        expect(result.data.incluirApartados).toBe(false);
      }
    });

    it('respeta el valor explícito cuando se envían en true', () => {
      const result = crearSucursalSchema.safeParse({ ...payloadValido, incluirReserva: true, incluirApartados: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.incluirReserva).toBe(true);
        expect(result.data.incluirApartados).toBe(true);
      }
    });
  });
});
