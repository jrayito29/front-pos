interface SkeletonProps {
  variant?: 'text' | 'block' | 'circle';
  className?: string;
}

const VARIANT_SHAPE: Record<NonNullable<SkeletonProps['variant']>, string> = {
  text: 'rounded',
  block: 'rounded-md',
  circle: 'rounded-full',
};

// SPEC-001 §Skeleton — decorativo, aria-hidden; el contenedor consumidor comunica el estado de
// carga (aria-busy, texto) a tecnología asistiva. Animación de pulso, apagada bajo reduced-motion.
export function Skeleton({ variant = 'block', className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse motion-reduce:animate-none bg-background-tertiary ${VARIANT_SHAPE[variant]} ${className}`}
    />
  );
}
