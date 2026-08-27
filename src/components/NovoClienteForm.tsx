import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/apiClient';

type FieldErrors = Record<string, string[]>;

const INPUT_CLASS =
  'w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft';
const LABEL_CLASS = 'mb-1 block text-sm font-medium text-foreground';

export function NovoClienteForm({ onCreated }: { onCreated: () => void }) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [genericError, setGenericError] = useState<string | null>(null);

  const canSubmit = nome.trim() !== '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setFieldErrors({});
    setGenericError(null);

    try {
      await apiFetch('/api/admin/clientes', {
        method: 'POST',
        body: {
          nome,
          email: email || null,
          telefone: telefone || null,
        },
      });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      onCreated();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as { errors?: FieldErrors };
        setFieldErrors(body.errors ?? {});
      } else {
        setGenericError('Erro ao criar cliente. Tenta novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {genericError && (
        <p role="alert" className="text-sm text-destructive">
          {genericError}
        </p>
      )}

      <div>
        <label htmlFor="novo-cliente-nome" className={LABEL_CLASS}>
          Nome
        </label>
        <input id="novo-cliente-nome" type="text" maxLength={255} value={nome} onChange={(e) => setNome(e.target.value)} className={INPUT_CLASS} />
        {fieldErrors.nome && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {fieldErrors.nome[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="novo-cliente-email" className={LABEL_CLASS}>
          Email
        </label>
        <input id="novo-cliente-email" type="email" maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT_CLASS} />
        {fieldErrors.email && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {fieldErrors.email[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="novo-cliente-telefone" className={LABEL_CLASS}>
          Telefone
        </label>
        <input
          id="novo-cliente-telefone"
          type="text"
          maxLength={20}
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className={INPUT_CLASS}
        />
        {fieldErrors.telefone && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {fieldErrors.telefone[0]}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="mt-2 flex h-11 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'A criar...' : 'Criar cliente'}
      </button>
    </form>
  );
}
