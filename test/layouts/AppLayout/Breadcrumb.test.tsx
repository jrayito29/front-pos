import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Breadcrumb } from '../../../src/layouts/AppLayout/Breadcrumb';
import { TENANT_NAV } from '../../../src/layouts/AppLayout/navConfig';
import { ROUTES } from '../../../src/constants/routes';

describe('Breadcrumb — SPEC-008 REQ-E2', () => {
  // spec:SPEC-008:REQ-E2
  it('muestra "Inicio" + el label del módulo activo según la ruta', () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.VENTAS]}>
        <Breadcrumb items={TENANT_NAV} />
      </MemoryRouter>
    );

    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Ventas')).toBeInTheDocument();
  });

  // spec:SPEC-008:REQ-E2
  it('se recalcula al cambiar de ruta activa', () => {
    // `rerender` con un <MemoryRouter> nuevo no resetea su historial interno (useState de solo
    // primer montaje) — se renderizan instancias independientes para simular rutas distintas.
    const { unmount } = render(
      <MemoryRouter initialEntries={[ROUTES.DASHBOARD]}>
        <Breadcrumb items={TENANT_NAV} />
      </MemoryRouter>
    );
    expect(screen.getByText('Panel')).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter initialEntries={[ROUTES.CLIENTES]}>
        <Breadcrumb items={TENANT_NAV} />
      </MemoryRouter>
    );
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.queryByText('Panel')).not.toBeInTheDocument();
  });

  // spec:SPEC-008:REQ-E2
  it('sin match en la lista de items, muestra solo "Inicio"', () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.NO_AUTORIZADO]}>
        <Breadcrumb items={TENANT_NAV} />
      </MemoryRouter>
    );

    expect(screen.getByText('Inicio')).toBeInTheDocument();
    TENANT_NAV.forEach((item) => {
      expect(screen.queryByText(item.label)).not.toBeInTheDocument();
    });
  });
});
