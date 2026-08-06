import { describe, expect, it } from 'vitest';
import { flattenNavItems, isNavGroup, TENANT_NAV, type NavGroupConfig, type NavItemConfig } from '../../../src/layouts/AppLayout/navConfig';

const plano: NavItemConfig = { key: 'panel', label: 'Panel', to: '/', icon: () => null };
const grupo: NavGroupConfig = {
  key: 'configuracion',
  label: 'Configuración',
  icon: () => null,
  items: [{ key: 'categorias', label: 'Categorías', to: '/categorias', icon: () => null, modulo: 'modulo.categorias' }],
};

// spec:SPEC-010:REQ-U8
describe('isNavGroup', () => {
  it('false para un ítem plano (sin `items`)', () => {
    expect(isNavGroup(plano)).toBe(false);
  });

  it('true para una entrada de grupo (con `items`)', () => {
    expect(isNavGroup(grupo)).toBe(true);
  });
});

describe('flattenNavItems', () => {
  it('devuelve los ítems planos tal cual', () => {
    expect(flattenNavItems([plano])).toEqual([plano]);
  });

  it('expande un grupo a sus sub-ítems, sin incluir la entrada de grupo en sí', () => {
    const result = flattenNavItems([plano, grupo]);
    expect(result).toEqual([plano, grupo.items[0]]);
  });
});

describe('TENANT_NAV', () => {
  // spec:SPEC-011:REQ-U8 — el grupo "configuracion" ahora incluye también "usuarios", gateado por
  // `soloRol` en vez de `modulo`.
  it('incluye el grupo "configuracion" con "categorias" y "usuarios" como sub-ítems', () => {
    const configuracion = TENANT_NAV.find((entry) => entry.key === 'configuracion');
    expect(configuracion).toBeDefined();
    expect(isNavGroup(configuracion!)).toBe(true);
    if (isNavGroup(configuracion!)) {
      expect(configuracion.items).toHaveLength(2);
      expect(configuracion.items[0]).toMatchObject({ key: 'categorias', to: '/categorias', modulo: 'modulo.categorias' });
      expect(configuracion.items[1]).toMatchObject({ key: 'usuarios', to: '/usuarios', soloRol: 'superadmin' });
      expect(configuracion.items[1].modulo).toBeUndefined();
    }
  });
});
