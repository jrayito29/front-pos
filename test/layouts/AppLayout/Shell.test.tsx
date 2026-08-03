import { afterEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { Shell } from '../../../src/layouts/AppLayout/Shell';
import { TENANT_NAV } from '../../../src/layouts/AppLayout/navConfig';
import { useUiStore } from '../../../src/stores/ui.store';
import { ROUTES } from '../../../src/constants/routes';

afterEach(() => {
  useUiStore.setState({ theme: 'light', sidebarCollapsed: false });
  delete document.documentElement.dataset.theme;
});

describe('Shell — SPEC-008 REQ-E6', () => {
  // spec:SPEC-008:REQ-E6
  it('sincroniza el atributo data-theme del documento con ui.store.theme', () => {
    useUiStore.setState({ theme: 'dark' });

    render(
      <MemoryRouter initialEntries={[ROUTES.DASHBOARD]}>
        <Routes>
          <Route
            path={ROUTES.DASHBOARD}
            element={<Shell navItems={TENANT_NAV} navAriaLabel="Navegación principal" role="Administradora" />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
