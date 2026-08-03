import { afterEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Topbar } from '../../../src/layouts/AppLayout/Topbar';
import { TENANT_NAV } from '../../../src/layouts/AppLayout/navConfig';
import { useUiStore } from '../../../src/stores/ui.store';
import { ROUTES } from '../../../src/constants/routes';

afterEach(() => {
  useUiStore.setState({ theme: 'light', sidebarCollapsed: false });
});

describe('Topbar — SPEC-008 REQ-X1', () => {
  // spec:SPEC-008:REQ-X1 — regresión real encontrada en la revisión de diseño: una regla CSS del
  // wireframe con selector mal acotado (`.shell[data-collapsed] .user-meta`, sin scope a `.sidebar`)
  // apagaba también el chip de usuario en la topbar al colapsar la sidebar.
  it('el chip de usuario permanece visible sin importar el estado de colapso de la sidebar', () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.DASHBOARD]}>
        <Topbar navItems={TENANT_NAV} role="Administradora" nombre="Ana Torres" />
      </MemoryRouter>
    );

    expect(screen.getByText('Ana Torres')).toBeInTheDocument();
    expect(screen.getByText('Administradora')).toBeInTheDocument();

    act(() => {
      useUiStore.getState().toggleSidebarCollapsed();
    });

    expect(screen.getByText('Ana Torres')).toBeInTheDocument();
    expect(screen.getByText('Administradora')).toBeInTheDocument();
  });
});
