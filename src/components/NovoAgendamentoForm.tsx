import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/lib/apiClient';
import { ClienteCombobox } from './ClienteCombobox';
import { TecnicoCombobox } from './TecnicoCombobox';

type Cliente = { id: number; nome: string };
type Tecnico = { id: number; name: string };
type FieldErrors = Record<string, string[]>;

const INPUT_CLASS =
  'w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft';
const LABEL_CLASS = 'mb-1 block text-sm font-medium text-foreground';

export function NovoAgendamentoForm({ onCreated }: { onCreated: () => void }) {
  const queryClient = useQueryClient();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [tecnico, setTecnico] = useState<Tecnico | null>(null);
  const [dataHora, setDataHora] = useState('');
  const [morada, setMorada] = useState('');
  const [notas, setNotas] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [genericError, setGenericError] = useState<string | null>(null);

  const canSubmit = cliente !== null && dataHora !== '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setFieldErrors({});
    setGenericError(null);

    try {
      await apiFetch('/api/admin/agendamentos', {
        method: 'POST',
        body: {
          cliente_id: cliente!.id,
          tecnico_id: tecnico?.id ?? null,
          data_hora: dataHora,
          morada: morada || null,
          notas: notas || null,
        },
      });
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      toast.success('Agendamento criado.');
      onCreated();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as { errors?: FieldErrors };
        setFieldErrors(body.errors ?? {});
      } else {
        setGenericError('Erro ao criar agendamento. Tenta novamente.');
        toast.error('Erro ao criar agendamento. Tenta novamente.');
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
        <ClienteCombobox value={cliente} onChange={setCliente} />
        {fieldErrors.cliente_id && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {fieldErrors.cliente_id[0]}
          </p>
        )}
      </div>

      <div>
        <TecnicoCombobox value={tecnico} onChange={setTecnico} />
        {fieldErrors.tecnico_id && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {fieldErrors.tecnico_id[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="novo-agendamento-data-hora" className={LABEL_CLASS}>
          Data e hora
        </label>
        <input
          id="novo-agendamento-data-hora"
          type="datetime-local"
          value={dataHora}
          onChange={(e) => setDataHora(e.target.value)}
          className={INPUT_CLASS}
        />
        {fieldErrors.data_hora && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {fieldErrors.data_hora[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="novo-agendamento-morada" className={LABEL_CLASS}>
          Morada
        </label>
        <input
          id="novo-agendamento-morada"
          type="text"
          maxLength={255}
          value={morada}
          onChange={(e) => setMorada(e.target.value)}
          className={INPUT_CLASS}
        />
        {fieldErrors.morada && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {fieldErrors.morada[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="novo-agendamento-notas" className={LABEL_CLASS}>
          Notas
        </label>
        <textarea
          id="novo-agendamento-notas"
          rows={3}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="mt-2 flex h-11 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'A criar...' : 'Criar agendamento'}
      </button>
    </form>
  );
}
