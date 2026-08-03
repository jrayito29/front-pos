import { Logo } from '../../../components/Logo';

// SPEC-002 REQ-U2 — columna izquierda del split, logo centrado vertical/horizontalmente
export function BrandPanel() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background-secondary">
      <Logo size="xl" />
    </div>
  );
}
