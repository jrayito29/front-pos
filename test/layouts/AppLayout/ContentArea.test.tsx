import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ContentArea } from '../../../src/layouts/AppLayout/ContentArea';

function renderContentArea() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<ContentArea />}>
          <Route index element={<p>contenido</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('ContentArea — SPEC-008 REQ-U6/U8', () => {
  // spec:SPEC-008:REQ-U6
  it('el contenedor con scroll permite overflow vertical y bloquea el horizontal', () => {
    const { container } = renderContentArea();
    const scroller = container.querySelector('.overflow-y-auto');

    expect(scroller).not.toBeNull();
    expect(scroller).toHaveClass('overflow-x-hidden');
  });

  // spec:SPEC-008:REQ-U8
  it('el difuminado inferior es un hermano `absolute` del contenedor con scroll, no un hijo `sticky` dentro de él', () => {
    const { container } = renderContentArea();
    const wrapper = container.querySelector('.relative');
    const scroller = container.querySelector('.overflow-y-auto');
    const fade = container.querySelector('.pointer-events-none.absolute.inset-x-0.bottom-0');

    expect(fade).not.toBeNull();
    expect(fade!.parentElement).toBe(wrapper);
    expect(fade!.parentElement).not.toBe(scroller);
  });
});
