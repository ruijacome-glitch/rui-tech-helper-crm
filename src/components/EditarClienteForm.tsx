import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/lib/apiClient';

type FieldErrors = Record<string, string[]>;

type Cliente = {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  morada: string | null;
  nif: string | null;
  notas: string | null;
};

const INPUT_CLASS =
  'w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft';
const LABEL_CLASS = 'mb-1 block text-sm font-medium text-foreground';

export function EditarClienteForm({ cliente, onSaved }: { cliente: Cliente; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState(cliente.nome);
  const [email, setEmail] = useState(cliente.email ?? '');
  const [telefone, setTelefone] = useState(cliente.telefone ?? '');
  const [morada, setMorada] = useState(cliente.morada ?? '');
  const [nif, setNif] = useState(cliente.nif ?? '');
  const [notas, setNotas] = useState(cliente.notas ?? '');
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
      await apiFetch(`/api/admin/clientes/${cliente.id}`, {
        method: 'PATCH',
        body: {
          nome,
          email: email || null,
          telefone: telefone || null,
          morada: morada || null,
          nif: nif || null,
          notas: notas || null,
        },
      });
      queryClient.invalidateQueries({ queryKey: ['cliente', String(cliente.id)] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente actualizado.');
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as { errors?: FieldErrors };
        setFieldErrors(body.errors ?? {});
      } else {
        setGenericError('Erro ao guardar. Tenta novamente.');
        toast.error('Erro ao guardar cliente. Tenta novamente.');
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
        <label htmlFor="editar-cliente-nome" className={LABEL_CLASS}>
          Nome
        </label>
        <input id="editar-cliente-nome" type="text" maxLength={255} value={nome} onChange={(e) => setNome(e.target.value)} className={INPUT_CLASS} />
        {fieldErrors.nome && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {fieldErrors.nome[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="editar-cliente-email" className={LABEL_CLASS}>
          Email
        </label>
        <input id="editar-cliente-email" type="email" maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT_CLASS} />
        {fieldErrors.email && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {fieldErrors.email[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="editar-cliente-telefone" className={LABEL_CLASS}>
          Telefone
        </label>
        <input
          id="editar-cliente-telefone"
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

      <div>
        <label htmlFor="editar-cliente-morada" className={LABEL_CLASS}>
          Morada
        </label>
        <input id="editar-cliente-morada" type="text" maxLength={255} value={morada} onChange={(e) => setMorada(e.target.value)} className={INPUT_CLASS} />
        {fieldErrors.morada && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {fieldErrors.morada[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="editar-cliente-nif" className={LABEL_CLASS}>
          NIF
        </label>
        <input id="editar-cliente-nif" type="text" maxLength={9} value={nif} onChange={(e) => setNif(e.target.value)} className={INPUT_CLASS} />
        {fieldErrors.nif && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {fieldErrors.nif[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="editar-cliente-notas" className={LABEL_CLASS}>
          Notas
        </label>
        <textarea id="editar-cliente-notas" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} className={INPUT_CLASS} />
      </div>

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="mt-2 flex h-11 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'A guardar...' : 'Guardar alterações'}
      </button>
    </form>
  );
}
