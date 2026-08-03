import { BrandPanel } from '../components/BrandPanel';
import { AnimatedAuthOutlet } from '../components/AnimatedAuthOutlet';

// SPEC-002 REQ-U1/U3/U10 — split 50/50; panel compartido entre /login y /registro (ver router.tsx).
// BrandPanel vive en el layout padre para nunca desmontarse al alternar entre modos.
export function AuthLayout() {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex">
        <BrandPanel />
      </div>
      <div className="flex min-h-dvh items-center justify-center px-6 py-12">
        <AnimatedAuthOutlet />
      </div>
    </div>
  );
}
