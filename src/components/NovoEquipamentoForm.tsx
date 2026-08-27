import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/lib/apiClient';
import { ClienteCombobox } from './ClienteCombobox';

type Cliente = { id: number; nome: string };
type FieldErrors = Record<string, string[]>;

const TIPOS = ['desktop', 'portatil', 'servidor', 'impressora', 'rede', 'outro'] as const;

const INPUT_CLASS =
  'w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft';
const LABEL_CLASS = 'mb-1 block text-sm font-medium text-foreground';

export function NovoEquipamentoForm({ onCreated }: { onCreated: () => void }) {
  const queryClient = useQueryClient();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [tipo, setTipo] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [notas, setNotas] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [genericError, setGenericError] = useState<string | null>(null);

  const canSubmit = cliente !== null && tipo !== '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setFieldErrors({});
    setGenericError(null);

    try {
      await apiFetch('/api/admin/equipamentos', {
        method: 'POST',
        body: {
          cliente_id: cliente!.id,
          tipo,
          marca: marca || null,
          modelo: modelo || null,
          numero_serie: numeroSerie || null,
          notas: notas || null,
        },
      });
      queryClient.invalidateQueries({ queryKey: ['equipamentos'] });
      toast.success('Equipamento criado.');
      onCreated();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as { errors?: FieldErrors };
        setFieldErrors(body.errors ?? {});
      } else {
        setGenericError('Erro ao criar equipamento. Tenta novamente.');
        toast.error('Erro ao criar equipamento. Tenta novamente.');
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
        <label htmlFor="novo-equipamento-tipo" className={LABEL_CLASS}>
          Tipo
        </label>
        <select id="novo-equipamento-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className={INPUT_CLASS}>
          <option value="">Selecionar tipo</option>
          {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {fieldErrors.tipo && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {fieldErrors.tipo[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="novo-equipamento-marca" className={LABEL_CLASS}>
          Marca
        </label>
        <input id="novo-equipamento-marca" type="text" maxLength={255} value={marca} onChange={(e) => setMarca(e.target.value)} className={INPUT_CLASS} />
      </div>

      <div>
        <label htmlFor="novo-equipamento-modelo" className={LABEL_CLASS}>
          Modelo
        </label>
        <input id="novo-equipamento-modelo" type="text" maxLength={255} value={modelo} onChange={(e) => setModelo(e.target.value)} className={INPUT_CLASS} />
      </div>

      <div>
        <label htmlFor="novo-equipamento-numero-serie" className={LABEL_CLASS}>
          Número de série
        </label>
        <input
          id="novo-equipamento-numero-serie"
          type="text"
          maxLength={255}
          value={numeroSerie}
          onChange={(e) => setNumeroSerie(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label htmlFor="novo-equipamento-notas" className={LABEL_CLASS}>
          Notas
        </label>
        <textarea id="novo-equipamento-notas" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} className={INPUT_CLASS} />
      </div>

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="mt-2 flex h-11 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'A criar...' : 'Criar equipamento'}
      </button>
    </form>
  );
}
