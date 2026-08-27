import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/apiClient';

type FieldErrors = Record<string, string[]>;

const INPUT_CLASS =
  'w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft';
const LABEL_CLASS = 'mb-1 block text-sm font-medium text-foreground';

export function NovaPecaForm({ onCreated }: { onCreated: () => void }) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [precoCusto, setPrecoCusto] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const [quantidadeAtual, setQuantidadeAtual] = useState('0');
  const [stockMinimo, setStockMinimo] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [genericError, setGenericError] = useState<string | null>(null);

  const canSubmit = nome.trim() !== '' && precoCusto !== '' && precoVenda !== '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setFieldErrors({});
    setGenericError(null);

    try {
      await apiFetch('/api/admin/pecas', {
        method: 'POST',
        body: {
          nome,
          descricao: descricao || null,
          preco_custo: Number(precoCusto),
          preco_venda: Number(precoVenda),
          quantidade_atual: Number(quantidadeAtual),
          stock_minimo: Number(stockMinimo),
        },
      });
      queryClient.invalidateQueries({ queryKey: ['pecas'] });
      onCreated();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as { errors?: FieldErrors };
        setFieldErrors(body.errors ?? {});
      } else {
        setGenericError('Erro ao criar peça. Tenta novamente.');
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
        <label htmlFor="nova-peca-nome" className={LABEL_CLASS}>
          Nome
        </label>
        <input id="nova-peca-nome" type="text" maxLength={255} value={nome} onChange={(e) => setNome(e.target.value)} className={INPUT_CLASS} />
        {fieldErrors.nome && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {fieldErrors.nome[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="nova-peca-descricao" className={LABEL_CLASS}>
          Descrição
        </label>
        <textarea id="nova-peca-descricao" rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} className={INPUT_CLASS} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="nova-peca-preco-custo" className={LABEL_CLASS}>
            Preço de custo (€)
          </label>
          <input
            id="nova-peca-preco-custo"
            type="number"
            step="0.01"
            min="0"
            value={precoCusto}
            onChange={(e) => setPrecoCusto(e.target.value)}
            className={INPUT_CLASS}
          />
          {fieldErrors.preco_custo && (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {fieldErrors.preco_custo[0]}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="nova-peca-preco-venda" className={LABEL_CLASS}>
            Preço de venda (€)
          </label>
          <input
            id="nova-peca-preco-venda"
            type="number"
            step="0.01"
            min="0"
            value={precoVenda}
            onChange={(e) => setPrecoVenda(e.target.value)}
            className={INPUT_CLASS}
          />
          {fieldErrors.preco_venda && (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {fieldErrors.preco_venda[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="nova-peca-quantidade" className={LABEL_CLASS}>
            Quantidade inicial
          </label>
          <input
            id="nova-peca-quantidade"
            type="number"
            min="0"
            value={quantidadeAtual}
            onChange={(e) => setQuantidadeAtual(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="nova-peca-stock-minimo" className={LABEL_CLASS}>
            Stock mínimo
          </label>
          <input
            id="nova-peca-stock-minimo"
            type="number"
            min="0"
            value={stockMinimo}
            onChange={(e) => setStockMinimo(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="mt-2 flex h-11 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'A criar...' : 'Criar peça'}
      </button>
    </form>
  );
}
