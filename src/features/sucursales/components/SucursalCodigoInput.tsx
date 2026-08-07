import { forwardRef, useId, type InputHTMLAttributes } from 'react';

interface SucursalCodigoInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: string;
}

// SPEC-012 REQ-U4 — variante especializada de `components/Input`, mismo criterio que
// `components/MaskedInput` (prefijo/sufijo visual absoluto, no soportado por el Input genérico):
// el prefijo "SUC-" es un adornment fijo no editable, el usuario solo escribe el sufijo (campo RHF
// `codigoSufijo`). El valor final ("SUC-" + sufijo) se arma en el submit del formulario, nunca aquí.
export const SucursalCodigoInput = forwardRef<HTMLInputElement, SucursalCodigoInputProps>(
  ({ error, id, className = '', ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          Código (opcional)
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type="text"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            placeholder='SUC-'
            className={`h-9 w-full rounded-lg border bg-background py-2 pl-3 pr-3.5 text-base text-foreground transition-colors duration-150 placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-brand-green/40 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-brand-coral' : 'border-border focus:border-brand-green'
              } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-sm text-brand-coral-text">
            {error}
          </p>
        )}
      </div>
    );
  }
);

SucursalCodigoInput.displayName = 'SucursalCodigoInput';
