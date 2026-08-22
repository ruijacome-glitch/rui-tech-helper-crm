import { useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth, isInvalidCredentials } from '@/lib/auth';

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
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h1>CRM — O Rui dos Computadores</h1>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={submitting}>{submitting ? 'A entrar...' : 'Entrar'}</button>
      </form>
    </div>
  );
}
