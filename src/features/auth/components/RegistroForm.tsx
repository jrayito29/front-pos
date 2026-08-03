import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { preRegistroSchema, type PreRegistroFormValues } from '../schemas/preRegistro.schema';
import { usePreRegistro } from '../hooks/usePreRegistro';
import { SocialAuthButtons } from './SocialAuthButtons';
import { ROUTES } from '../../../constants/routes';

// SPEC-003 REQ-X1 — único código con mensaje inline; el resto lo comunica el toast de usePreRegistro
const INLINE_ERROR_MESSAGES: Record<string, string> = {
  ERR_EMAIL_ALREADY_EXISTS: 'Este correo ya está registrado.',
};

export function RegistroForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PreRegistroFormValues>({ resolver: zodResolver(preRegistroSchema) });

  const { mutate, isPending, error } = usePreRegistro();
  const inlineError = error ? INLINE_ERROR_MESSAGES[error.code] : undefined;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Crea tu cuenta</h1>
        <p className="text-sm text-foreground-secondary">Regístrate para empezar a usar Deccode POS.</p>
      </div>

      <form onSubmit={handleSubmit((values) => mutate(values))} noValidate className="flex flex-col gap-5">
        {inlineError && (
          <p role="alert" className="rounded-lg bg-brand-coral-bg px-3.5 py-2.5 text-sm text-brand-coral-text">
            {inlineError}
          </p>
        )}

        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          disabled={isPending}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          disabled={isPending}
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" fullWidth isLoading={isPending} loadingText="Creando tu cuenta...">
          Registrarse
        </Button>
      </form>

      <SocialAuthButtons />

      {/* SPEC-003 REQ-U9/E4 (v1.2.0) — punto de regreso hacia el modo login del panel compartido */}
      <p className="text-center text-sm text-foreground-secondary">
        ¿Ya tienes una cuenta?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="font-medium text-brand-green transition-colors hover:text-brand-green-hover"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
