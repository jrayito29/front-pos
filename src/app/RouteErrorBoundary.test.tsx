import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouteErrorBoundary } from './RouteErrorBoundary';

function ThrowingChild(): never {
  throw new Error('Failed to fetch dynamically imported module');
}

const originalLocation = window.location;
const reloadMock = vi.fn();

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
});

describe('RouteErrorBoundary', () => {
  it('renderiza los children normalmente cuando no hay error', () => {
    render(
      <RouteErrorBoundary>
        <p>contenido normal</p>
      </RouteErrorBoundary>
    );

    expect(screen.getByText('contenido normal')).toBeInTheDocument();
  });

  // spec:SPEC-006:REQ-X1
  it('ante una falla de chunk, muestra el fallback y "Recargar" fuerza un full page reload', async () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload: reloadMock },
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const user = userEvent.setup();
    render(
      <RouteErrorBoundary>
        <ThrowingChild />
      </RouteErrorBoundary>
    );

    expect(screen.getByText(/no se pudo cargar la página/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Recargar' }));

    expect(reloadMock).toHaveBeenCalled();
  });
});
