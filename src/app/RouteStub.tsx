interface RouteStubProps {
  title: string;
}

// Placeholder de rutas destino que SPEC-002 referencia pero aún no tienen spec/feature propia
// (completar perfil, selección de sucursal, cambio de contraseña temporal, panel sysadmin).
export function RouteStub({ title }: RouteStubProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <p className="text-sm text-foreground-secondary">
        Pendiente de implementación: <span className="font-medium text-foreground">{title}</span>
      </p>
    </div>
  );
}
