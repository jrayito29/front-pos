import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { loginSchema, type LoginFormValues } from '../schemas/login.schema';
import { useLogin } from '../hooks/useLogin';
import { ROUTES } from '../../../constants/routes';

// SPEC-002 REQ-X1/X5/X6/X7 — mensajes inline específicos, nunca "Campo inválido" genérico
const INLINE_ERROR_MESSAGES: Record<string, string> = {
  ERR_INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  ERR_ACCOUNT_LOCKED: 'Tu cuenta está bloqueada temporalmente por múltiples intentos fallidos. Intenta de nuevo más tarde.',
  ERR_SUBSCRIPTION_EXPIRED: 'Tu suscripción ha vencido. Contacta a tu administrador para renovarla.',
  ERR_EMAIL_NOT_VERIFIED: 'Tu correo aún no ha sido verificado.',
};

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const { mutate, isPending, error } = useLogin();
  const inlineError = error ? INLINE_ERROR_MESSAGES[error.code] : undefined;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Bienvenido de nuevo</h1>
        <p className="text-sm text-foreground-secondary">
          Ingresa tus credenciales para acceder a tu cuenta de Deccode POS.
        </p>
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

        <div className="flex flex-col gap-1.5">
          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            disabled={isPending}
            error={errors.password?.message}
            {...register('password')}
          />
          <Link
            to={ROUTES.OLVIDE_CONTRASENA}
            className="self-end text-sm font-medium text-brand-green transition-colors hover:text-brand-green-hover"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" fullWidth isLoading={isPending} loadingText="Iniciando sesión...">
          Iniciar sesión
        </Button>
      </form>

      {/* SPEC-002 REQ-U11/E8 — punto de alternancia hacia el modo registro del panel compartido */}
      <p className="text-center text-sm text-foreground-secondary">
        ¿No tienes una cuenta?{' '}
        <Link
          to={ROUTES.REGISTRO}
          className="font-medium text-brand-green transition-colors hover:text-brand-green-hover"
        >
          Regístrate aquí
        </Link>
      </p>
    </div>
  );
}
