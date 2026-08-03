interface StepIndicatorProps {
  steps: readonly string[];
  activeStep: number;
}

// SPEC-004 REQ-U3/S1 — indicador de progreso siempre visible; el paso activo se resalta frente a
// los completados y los pendientes (ui-ux-pro-max §Forms & Feedback: multi-step-progress).
export function StepIndicator({ steps, activeStep }: StepIndicatorProps) {
  return (
    <ol className="flex items-center gap-3" aria-label={`Paso ${activeStep + 1} de ${steps.length}`}>
      {steps.map((label, index) => {
        const isReached = index <= activeStep;
        return (
          <li key={label} className="flex flex-1 flex-col gap-2">
            <span
              aria-hidden="true"
              className={`h-1.5 rounded-full transition-colors duration-200 ${
                isReached ? 'bg-brand-green' : 'bg-border'
              }`}
            />
            <span
              aria-current={index === activeStep ? 'step' : undefined}
              className={`text-sm font-medium transition-colors duration-200 ${
                index === activeStep ? 'text-foreground' : 'text-foreground-muted'
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
