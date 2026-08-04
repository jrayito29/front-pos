import { useId } from 'react';

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hideLabel?: boolean;
}

// Componente genérico — toggle accesible (role="switch"), reemplaza el checkbox nativo en toda
// opción binaria del proyecto (no acorde al design system). Press/hover feedback y timing según
// emilkowalski (150ms ease-out), mismo criterio que Button.
export function Switch({ label, checked, onChange, hideLabel = false }: SwitchProps) {
  const labelId = useId();

  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50 focus-visible:ring-offset-2 ${
          checked ? 'bg-brand-green' : 'bg-background-tertiary'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-150 ease-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
      <span
        id={labelId}
        onClick={() => onChange(!checked)}
        className={hideLabel ? 'sr-only' : 'cursor-pointer text-sm text-foreground'}
      >
        {label}
      </span>
    </div>
  );
}
