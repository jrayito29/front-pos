import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SidebarBrand } from '../../../src/layouts/AppLayout/SidebarBrand';

describe('SidebarBrand — SPEC-008 REQ-U9/S2/X3', () => {
  // spec:SPEC-008:REQ-U9 / spec:SPEC-008:REQ-S2
  it('sin logoUrl, muestra la marca del sistema (Logo)', () => {
    render(<SidebarBrand collapsed={false} />);
    expect(screen.getByRole('img', { name: 'Deccode' })).toBeInTheDocument();
  });

  // spec:SPEC-008:REQ-U9
  it('con logoUrl, reemplaza la marca del sistema por el logo de la empresa', () => {
    render(<SidebarBrand collapsed={false} logoUrl="https://cdn.example.com/logo.png" companyName="Ferretería Los Pinos" />);

    expect(screen.queryByRole('img', { name: 'Deccode' })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ferretería Los Pinos' })).toBeInTheDocument();
  });

  // spec:SPEC-008:REQ-X3
  it('sin companyName, omite el subtítulo por completo (no placeholder vacío)', () => {
    const { container } = render(<SidebarBrand collapsed={false} />);
    expect(screen.getByText('Deccode POS')).toBeInTheDocument();
    // Sin companyName solo debe existir la línea del nombre de marca — ninguna línea de subtítulo.
    expect(container.querySelectorAll('.truncate')).toHaveLength(1);
  });
});
