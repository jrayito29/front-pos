import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-brand-green text-white hover:bg-brand-green-hover',
  secondary: 'border border-border bg-background-secondary text-foreground hover:bg-background-tertiary',
  ghost: 'bg-transparent text-foreground hover:bg-background-secondary',
  danger: 'bg-brand-coral text-white hover:bg-brand-coral-hover',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-base',
  lg: 'h-12 px-6 text-base',
};

// SPEC-001 §Button — press feedback y timing según emilkowalski (scale(0.97), 150ms ease-out)
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      fullWidth = false,
      disabled,
      className = '',
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-transform duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50 focus-visible:ring-offset-2 ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {isLoading && <Spinner className="h-4 w-4" />}
        {isLoading && loadingText ? loadingText : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
