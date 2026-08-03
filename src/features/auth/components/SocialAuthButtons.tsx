import { Button } from '../../../components/Button';
import { AppleIcon, GoogleIcon, MicrosoftIcon } from './SocialIcons';

// SPEC-003 REQ-U7/U8 — bloque de auth social debajo del formulario principal, deshabilitado hasta
// que exista integración real con cada proveedor (sin contrato de backend aún).
const PROVIDERS = [
  { key: 'google', label: 'Continuar con Google', Icon: GoogleIcon },
  { key: 'microsoft', label: 'Continuar con Microsoft', Icon: MicrosoftIcon },
  { key: 'apple', label: 'Continuar con Apple', Icon: AppleIcon },
] as const;

export function SocialAuthButtons() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        <span className="text-sm text-foreground-muted">o continúa con</span>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-2.5">
        {PROVIDERS.map(({ key, label, Icon }) => (
          <Button key={key} type="button" variant="secondary" fullWidth disabled title="Próximamente disponible">
            <Icon className="h-5 w-5" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
