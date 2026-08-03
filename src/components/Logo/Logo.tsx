interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// SPEC-001 §Logo — tamaños mapeados a la escala de espaciado por defecto de Tailwind (tokens, no px sueltos)
const SIZE_STYLES: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'h-8 w-8 rounded-lg text-base',
  md: 'h-16 w-16 rounded-xl text-3xl',
  lg: 'h-24 w-24 rounded-2xl text-5xl',
  xl: 'h-32 w-32 rounded-3xl text-6xl',
};

export function Logo({ size = 'md', className = '' }: LogoProps) {
  return (
    <div
      role="img"
      aria-label="Deccode"
      className={`flex select-none items-center justify-center bg-brand-green font-bold text-white ${SIZE_STYLES[size]} ${className}`}
    >
      D
    </div>
  );
}
