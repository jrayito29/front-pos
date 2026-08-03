import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Logo } from '../../../components/Logo';
import { Button } from '../../../components/Button';
import {
  completarPerfilSchema,
  COMPLETAR_PERFIL_DEFAULT_VALUES,
  PASO_DATOS_PERSONALES_FIELDS,
  PASO_EMPRESA_FIELDS,
  type CompletarPerfilFormValues,
} from '../schemas/completarPerfil.schema';
import { useCompletarPerfil } from '../hooks/useCompletarPerfil';
import { StepIndicator } from './StepIndicator';
import { StepDatosPersonales } from './StepDatosPersonales';
import { StepDomicilio } from './StepDomicilio';
import { StepEmpresa } from './StepEmpresa';
import { WizardStepTransition } from './WizardStepTransition';

const STEPS = ['Datos personales', 'Domicilio', 'Empresa'] as const;
const LAST_STEP = STEPS.length - 1;

// SPEC-004 — vista de completar perfil (onboarding, 3er paso). Layout propio sin BrandPanel
// (REQ-U2): Logo `sm` anclado en la esquina, sin columna de marca dedicada (a diferencia de
// AuthLayout/SPEC-002). Un único useForm (REQ-U9) compartido por los 3 pasos vía renderizado
// condicional — nunca se desmonta, por lo que RHF conserva los valores al retroceder (REQ-E2).
export function CompletarPerfilWizard() {
  const [step, setStep] = useState(0);
  const methods = useForm<CompletarPerfilFormValues>({
    resolver: zodResolver(completarPerfilSchema),
    defaultValues: COMPLETAR_PERFIL_DEFAULT_VALUES,
  });
  const { trigger, handleSubmit } = methods;
  const { mutate, isPending } = useCompletarPerfil();

  function goBack() {
    setStep((current) => Math.max(current - 1, 0));
  }

  function goNext() {
    setStep((current) => Math.min(current + 1, LAST_STEP));
  }

  // REQ-E1 — "Siguiente" valida solo los campos del paso actual antes de avanzar; "Domicilio"
  // (índice 1) no tiene campos requeridos y avanza sin validar.
  //
  // Guard de doble envío: el botón "Completar registro" solo queda `disabled` hasta el próximo
  // render con isPending=true — un doble click (o doble submit del form) antes de ese render puede
  // llamar mutate() dos veces. La segunda petición llega después de que la primera ya creó la
  // empresa, el backend la rechaza con ERR_EMPRESA_ALREADY_EXISTS (409, REQ-X1), y ese handler hace
  // clearSession() + redirige a /login — el usuario ve el dashboard un instante y luego cae a login.
  async function handleSiguiente() {
    if (isPending) return;
    if (step === 0) {
      const valid = await trigger(PASO_DATOS_PERSONALES_FIELDS);
      if (!valid) return;
    }
    if (step === LAST_STEP) {
      const valid = await trigger(PASO_EMPRESA_FIELDS);
      if (!valid) return;
      // REQ-E3 — envía el body completo acumulado de los 3 pasos.
      void handleSubmit((values) => mutate(values))();
      return;
    }
    goNext();
  }

  return (
    // REQ-U12 — el wizard cabe en 100dvh sin scroll de página (`overflow-hidden`); Logo/StepIndicator
    // y la barra de navegación quedan fijos, solo el área de campos del paso activo (más abajo)
    // gana scroll interno si su contenido excede el alto disponible.
    <div className="relative h-dvh overflow-hidden px-6 py-10">
      <Logo size="sm" className="absolute left-6 top-6" />
      <div className="mx-auto flex h-full max-w-xl items-center justify-center">
        <div className="flex max-h-full w-full flex-col gap-8">
          <StepIndicator steps={STEPS} activeStep={step} />

          <form
            noValidate
            className="flex min-h-0 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSiguiente();
            }}
          >
            <div className="min-h-0 overflow-y-auto">
              <WizardStepTransition activeKey={step}>
                {step === 0 && <StepDatosPersonales methods={methods} />}
                {step === 1 && <StepDomicilio methods={methods} />}
                {step === LAST_STEP && <StepEmpresa methods={methods} disabled={isPending} />}
              </WizardStepTransition>
            </div>

            {/* REQ-S4 — Atrás y "Omitir por ahora" se deshabilitan mientras la mutación está en curso. */}
            <div className="mt-8 flex shrink-0 items-center justify-between gap-3">
              <Button type="button" variant="secondary" onClick={goBack} disabled={step === 0 || isPending}>
                Atrás
              </Button>

              <div className="flex items-center gap-3">
                {step === 1 && (
                  <Button type="button" variant="ghost" onClick={goNext} disabled={isPending}>
                    Omitir por ahora
                  </Button>
                )}
                <Button type="submit" isLoading={step === LAST_STEP && isPending} loadingText="Creando tu empresa...">
                  {step === LAST_STEP ? 'Completar registro' : 'Siguiente'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
