import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LazyWidget } from './LazyWidget';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LazyWidget', () => {
  // spec:SPEC-006:REQ-U5
  it('muestra el fallback mientras el import() está pendiente y luego renderiza el componente', async () => {
    const { promise, resolve } = deferred<{ default: () => React.ReactElement }>();

    render(<LazyWidget loader={() => promise} label="el gráfico de ventas" fallback={<p>cargando widget</p>} />);

    expect(screen.getByText('cargando widget')).toBeInTheDocument();

    resolve({ default: () => <p>gráfico listo</p> });

    expect(await screen.findByText('gráfico listo')).toBeInTheDocument();
  });

  // spec:SPEC-006:REQ-X2
  it('si el import() falla, aísla el error sin afectar el resto de la vista', async () => {
    const { promise, reject } = deferred<{ default: () => React.ReactElement }>();

    render(
      <div>
        <p>resto de la vista intacto</p>
        <LazyWidget loader={() => promise} label="el gráfico de ventas" />
      </div>
    );

    reject(new Error('network error'));

    expect(await screen.findByText(/no se pudo cargar el gráfico de ventas/i)).toBeInTheDocument();
    expect(screen.getByText('resto de la vista intacto')).toBeInTheDocument();
  });

  // spec:SPEC-006:REQ-X2
  it('"Reintentar" dispara un nuevo import() del widget tras un fallo previo', async () => {
    const user = userEvent.setup();
    const first = deferred<{ default: () => React.ReactElement }>();
    const second = deferred<{ default: () => React.ReactElement }>();
    const loader = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    render(<LazyWidget loader={loader} label="el gráfico de ventas" />);

    first.reject(new Error('network error'));
    expect(await screen.findByText(/no se pudo cargar el gráfico de ventas/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(loader).toHaveBeenCalledTimes(2);

    second.resolve({ default: () => <p>gráfico listo</p> });
    expect(await screen.findByText('gráfico listo')).toBeInTheDocument();
  });
});
