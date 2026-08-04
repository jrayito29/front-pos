import { useId } from 'react';
import { IMaskInput } from 'react-imask';

type MaskKind = 'currency' | 'percentage' | 'integer';

interface MaskedInputProps {
  label: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  kind: MaskKind;
  max?: number;
  required?: boolean;
}

const KIND_CONFIG: Record<MaskKind, { scale: number; max: number; prefix?: string; suffix?: string }> = {
  currency: { scale: 2, max: 999_999_999, prefix: '$' },
  percentage: { scale: 2, max: 100, suffix: '%' },
  integer: { scale: 0, max: 999_999 },
};

// Componente genérico — todos los campos numéricos/monetarios/porcentuales del proyecto usan
// react-imask (nunca `type="number"` ni texto libre): impide letras y normaliza el separador
// decimal en el DOM, mientras el valor que sale por `onChange` (`unmask`) sigue siendo el string
// numérico limpio ("1234.56") que espera el contrato del backend (SPEC-016 §DESIGN, Decimal como string).
export function MaskedInput({ label, error, value, onChange, onBlur, kind, max, required = false }: MaskedInputProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const config = KIND_CONFIG[kind];

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-brand-coral-text"> *</span>}
      </label>
      <div className="relative">
        {config.prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-base text-foreground-muted">
            {config.prefix}
          </span>
        )}
        <IMaskInput
          id={inputId}
          mask={Number}
          scale={config.scale}
          min={0}
          max={max ?? config.max}
          radix="."
          thousandsSeparator=","
          padFractionalZeros={false}
          normalizeZeros
          unmask
          value={value}
          onAccept={(unmaskedValue: string) => onChange(unmaskedValue)}
          onBlur={onBlur}
          inputMode="decimal"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`h-9 w-full rounded-lg border bg-background text-base text-foreground transition-colors duration-150 placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-brand-green/40 disabled:cursor-not-allowed disabled:opacity-50 ${config.prefix ? 'pl-7' : 'pl-3.5'
            } ${config.suffix ? 'pr-8' : 'pr-3.5'} ${error ? 'border-brand-coral' : 'border-border focus:border-brand-green'}`}
        />
        {config.suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-base text-foreground-muted">
            {config.suffix}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-brand-coral-text">
          {error}
        </p>
      )}
    </div>
  );
}
