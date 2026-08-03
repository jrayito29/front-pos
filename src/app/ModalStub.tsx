interface ModalStubProps {
  title: string;
}

// Placeholder de los modales bloqueantes que RequireAuth activa por bandera de sesión
// (selección de sucursal, cambio de contraseña temporal) — aún sin spec/feature propia.
export function ModalStub({ title }: ModalStubProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-sm rounded-xl bg-background p-6 shadow-sm">
        <p className="text-sm text-foreground-secondary">
          Pendiente de implementación: <span className="font-medium text-foreground">{title}</span>
        </p>
      </div>
    </div>
  );
}
