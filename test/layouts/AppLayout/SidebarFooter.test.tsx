import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { SidebarFooter } from '../../../src/layouts/AppLayout/SidebarFooter';
import { useUiStore } from '../../../src/stores/ui.store';
import { useSessionStore } from '../../../src/stores/session.store';
import { ROUTES } from '../../../src/constants/routes';

afterEach(() => {
  useSessionStore.getState().clearSession();
  useUiStore.setState({ theme: 'light', sidebarCollapsed: false });
});

function renderFooter() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.DASHBOARD]}>
      <Routes>
        <Route path={ROUTES.DASHBOARD} element={<SidebarFooter collapsed={false} />} />
        <Route path={ROUTES.LOGIN} element={<p>pantalla de login</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SidebarFooter — SPEC-008 REQ-E5/E6', () => {
  // spec:SPEC-008:REQ-E6
  it('al hacer click en el toggle de tema, alterna ui.store.theme', async () => {
    const user = userEvent.setup();
    renderFooter();

    expect(useUiStore.getState().theme).toBe('light');
    await user.click(screen.getByRole('button', { name: 'Cambiar a tema oscuro' }));
    expect(useUiStore.getState().theme).toBe('dark');
  });

  // spec:SPEC-008:REQ-E5
  it('al hacer click en "Cerrar sesión", limpia la sesión y redirige a /login', async () => {
    useSessionStore
      .getState()
      .setTenantSession({ accessToken: 'access-1', refreshToken: 'refresh-1', usuarioId: 'usuario-9', empresaId: 'empresa-9' });
    const user = userEvent.setup();
    renderFooter();

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByText('pantalla de login')).toBeInTheDocument();
    expect(useSessionStore.getState().accessToken).toBeNull();
  });
});
