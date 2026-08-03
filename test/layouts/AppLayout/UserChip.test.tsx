import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserChip } from '../../../src/layouts/AppLayout/UserChip';

describe('UserChip — SPEC-008 REQ-U14/X3', () => {
  // spec:SPEC-008:REQ-U14
  it('con role definido, lo muestra', () => {
    render(<UserChip role="Administradora" />);
    expect(screen.getByText('Administradora')).toBeInTheDocument();
  });

  // spec:SPEC-008:REQ-X3
  it('sin role (undefined), muestra un rótulo neutro en vez de dejar el chip vacío', () => {
    render(<UserChip role={undefined} />);
    expect(screen.getByText('Sesión activa')).toBeInTheDocument();
  });

  // spec:SPEC-008:REQ-X3
  it('sin `nombre`, no renderiza una línea de nombre inventada', () => {
    const { container } = render(<UserChip role="Cajero" />);
    expect(screen.getByText('Cajero')).toBeInTheDocument();
    expect(container.textContent).toBe('Cajero');
  });

  // spec:SPEC-008:REQ-U14
  it('con `nombre` disponible, lo muestra junto al rol', () => {
    render(<UserChip role="Administradora" nombre="Ana Torres" />);
    expect(screen.getByText('Ana Torres')).toBeInTheDocument();
    expect(screen.getByText('Administradora')).toBeInTheDocument();
  });
});
