import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/apiClient';
import { ClienteCombobox } from './ClienteCombobox';
import { TecnicoCombobox } from './TecnicoCombobox';

type Cliente = { id: number; nome: string };
type Tecnico = { id: number; name: string };
type FieldErrors = Record<string, string[]>;

const CATEGORIAS = ['hardware', 'software', 'rede', 'backup'] as const;
const PRIORIDADES = ['urgente', 'normal', 'baixa'] as const;

const INPUT_CLASS =
  'w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft';
const LABEL_CLASS = 'mb-1 block text-sm font-medium text-foreground';

export function NovaIntervencaoForm({ onCreated }: { onCreated: () => void }) {
  const queryClient = useQueryClient();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [tecnico, setTecnico] = useState<Tecnico | null>(null);
  const [categoria, setCategoria] = useState('');
  const [prioridade, setPrioridade] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [genericError, setGenericError] = useState<string | null>(null);

  const canSubmit = cliente !== null && categoria !== '' && prioridade !== '' && titulo.trim() !== '' && descricao.trim() !== '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setFieldErrors({});
    setGenericError(null);

    try {
      await apiFetch('/api/admin/tickets', {
        method: 'POST',
        body: {
          cliente_id: cliente!.id,
          tecnico_id: tecnico?.id ?? null,
          categoria,
          prioridade,
          titulo,
          descricao,
        },
      });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      onCreated();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as { errors?: FieldErrors };
        setFieldErrors(body.errors ?? {});
      } else {
        setGenericError('Erro ao criar intervenção. Tenta novamente.');
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
        <label htmlFor="nova-intervencao-categoria" className={LABEL_CLASS}>
          Categoria
        </label>
        <select
          id="nova-intervencao-categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="">Selecionar categoria</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {fieldErrors.categoria && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {fieldErrors.categoria[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="nova-intervencao-prioridade" className={LABEL_CLASS}>
          Prioridade
        </label>
        <select
          id="nova-intervencao-prioridade"
          value={prioridade}
          onChange={(e) => setPrioridade(e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="">Selecionar prioridade</option>
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {fieldErrors.prioridade && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {fieldErrors.prioridade[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="nova-intervencao-titulo" className={LABEL_CLASS}>
          Título
        </label>
        <input
          id="nova-intervencao-titulo"
          type="text"
          maxLength={255}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className={INPUT_CLASS}
        />
        {fieldErrors.titulo && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {fieldErrors.titulo[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="nova-intervencao-descricao" className={LABEL_CLASS}>
          Descrição
        </label>
        <textarea
          id="nova-intervencao-descricao"
          rows={4}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className={INPUT_CLASS}
        />
        {fieldErrors.descricao && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {fieldErrors.descricao[0]}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="mt-2 flex h-11 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'A criar...' : 'Criar intervenção'}
      </button>
    </form>
  );
}
