import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationsDropdown } from '../../../src/layouts/AppLayout/NotificationsDropdown';

describe('NotificationsDropdown — SPEC-008 REQ-E3/E4/S4', () => {
  // spec:SPEC-008:REQ-S4
  it('muestra un indicador visual cuando hay notificaciones sin leer', () => {
    const { container } = render(<NotificationsDropdown />);
    expect(container.querySelector('[aria-hidden="true"].bg-brand-coral')).not.toBeNull();
  });

  // spec:SPEC-008:REQ-E3
  it('al hacer click en el trigger, abre el panel de notificaciones', async () => {
    const user = userEvent.setup();
    render(<NotificationsDropdown />);

    const trigger = screen.getByRole('button', { name: 'Notificaciones' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Notificaciones')).toBeInTheDocument();
    expect(screen.getByText(/Stock bajo/)).toBeInTheDocument();
  });

  // spec:SPEC-008:REQ-E4
  it('al hacer click fuera, cierra el panel', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <NotificationsDropdown />
        <button type="button">afuera</button>
      </div>
    );

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));
    expect(screen.getByRole('button', { name: 'Notificaciones' })).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: 'afuera' }));
    expect(screen.getByRole('button', { name: 'Notificaciones' })).toHaveAttribute('aria-expanded', 'false');
  });

  // spec:SPEC-008:REQ-E4
  it('al presionar Escape, cierra el panel', async () => {
    const user = userEvent.setup();
    render(<NotificationsDropdown />);

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));
    expect(screen.getByRole('button', { name: 'Notificaciones' })).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Notificaciones' })).toHaveAttribute('aria-expanded', 'false');
  });
});
