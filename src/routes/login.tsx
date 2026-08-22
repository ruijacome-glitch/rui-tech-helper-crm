import { useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth, isInvalidCredentials } from '@/lib/auth';
import { LogoMark, Wordmark } from '@/components/brand/Brand';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate({ to: '/tickets' });
    } catch (err) {
      setError(isInvalidCredentials(err) ? 'Credenciais inválidas.' : 'Erro ao iniciar sessão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={handleSubmit} className="panel-tech w-full max-w-sm p-8">
        <div className="mb-8 flex flex-col items-center gap-3">
          <LogoMark className="size-14" />
          <Wordmark className="text-center" />
          <p className="label-tech text-muted-foreground">Backoffice</p>
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium text-foreground/90">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            className="w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft"
          />
        </label>
        <label className="mb-6 block">
          <span className="mb-1 block text-sm font-medium text-foreground/90">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft"
          />
        </label>

        {error && (
          <p role="alert" className="mb-4 rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'A entrar...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
