import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react';
import { EyeIcon, EyeOffIcon } from './PasswordIcons';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
}

// SPEC-001 §Input
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, type = 'text', id, className = '', ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const isPassword = type === 'password';
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isPassword && isVisible ? 'text' : type}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={`h-11 w-full rounded-lg border bg-background px-3.5 text-base text-foreground transition-colors duration-150 placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-brand-green/40 disabled:cursor-not-allowed disabled:opacity-50 ${
              error ? 'border-brand-coral' : 'border-border focus:border-brand-green'
            } ${isPassword ? 'pr-11' : ''} ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setIsVisible((visible) => !visible)}
              aria-label={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-foreground-secondary transition-colors hover:text-foreground"
            >
              {isVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
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
);

Input.displayName = 'Input';
