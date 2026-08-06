import { describe, expect, it } from 'vitest';
import {
  ROLES_ASIGNABLES,
  USUARIO_ERROR_CODE_TO_FIELD,
  USUARIO_ERRORS,
  USUARIO_ROL_LABEL,
} from '../../../src/features/usuarios/constants/usuario.constants';

// spec:SPEC-011:REQ-U9
describe('ROLES_ASIGNABLES', () => {
  it('expone los 7 roles asignables documentados en usuarios-gestion.spec.md REQ-U7', () => {
    expect(ROLES_ASIGNABLES).toEqual(['admin', 'gerente', 'almacenista', 'comprador', 'contador', 'rrhh', 'cajero']);
  });

  it('excluye superadmin y sysadmin — no son asignables desde este módulo', () => {
    expect(ROLES_ASIGNABLES).not.toContain('superadmin');
    expect(ROLES_ASIGNABLES).not.toContain('sysadmin');
  });
});

describe('USUARIO_ROL_LABEL', () => {
  it('tiene una etiqueta en español para cada rol asignable', () => {
    ROLES_ASIGNABLES.forEach((rol) => {
      expect(typeof USUARIO_ROL_LABEL[rol]).toBe('string');
      expect(USUARIO_ROL_LABEL[rol].length).toBeGreaterThan(0);
    });
  });
});

// spec:SPEC-011:REQ-X4 — códigos de negocio mapeables a un campo del formulario
describe('USUARIO_ERROR_CODE_TO_FIELD', () => {
  it('mapea email duplicado al campo "email"', () => {
    expect(USUARIO_ERROR_CODE_TO_FIELD[USUARIO_ERRORS.EMAIL_ALREADY_EXISTS]).toBe('email');
  });

  it('mapea rol inválido al campo "role"', () => {
    expect(USUARIO_ERROR_CODE_TO_FIELD[USUARIO_ERRORS.ROLE_INVALID]).toBe('role');
  });

  // spec:SPEC-011:REQ-X5/X6 — códigos sin campo de formulario asociado (deben resolverse por toast)
  it('NO mapea códigos sin campo de formulario asociado (usuario no encontrado/permiso/autodesactivación)', () => {
    expect(USUARIO_ERROR_CODE_TO_FIELD[USUARIO_ERRORS.USER_NOT_FOUND]).toBeUndefined();
    expect(USUARIO_ERROR_CODE_TO_FIELD[USUARIO_ERRORS.PERMISSION_DENIED]).toBeUndefined();
    expect(USUARIO_ERROR_CODE_TO_FIELD[USUARIO_ERRORS.SELF_DEACTIVATION]).toBeUndefined();
  });
});
