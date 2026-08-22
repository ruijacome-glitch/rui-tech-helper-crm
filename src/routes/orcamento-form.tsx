import { useState } from 'react';
import { apiFetch } from '@/lib/apiClient';

type Item = { descricao: string; quantidade: number; preco_unitario: number };

const INPUT_CLASS =
  'rounded-md border border-input bg-secondary px-2 py-1.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft';

export function OrcamentoForm({ basePath, ticketId, onCreated }: { basePath: string; ticketId: number; onCreated: () => void }) {
  const [itens, setItens] = useState<Item[]>([{ descricao: '', quantidade: 1, preco_unitario: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(index: number, patch: Partial<Item>) {
    setItens((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItens((prev) => [...prev, { descricao: '', quantidade: 1, preco_unitario: 0 }]);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`${basePath}/tickets/${ticketId}/orcamentos`, { method: 'POST', body: { itens } });
      onCreated();
    } catch {
      setError('Erro ao criar orçamento.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 rounded-md border border-border p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Novo orçamento</h3>
      {itens.map((item, index) => (
        <div key={index} className="mb-2 flex gap-2">
          <input
            placeholder="Descrição"
            value={item.descricao}
            onChange={(e) => updateItem(index, { descricao: e.target.value })}
            className={`${INPUT_CLASS} flex-1`}
          />
          <input
            type="number"
            min={1}
            value={item.quantidade}
            onChange={(e) => updateItem(index, { quantidade: Number(e.target.value) })}
            className={`${INPUT_CLASS} w-20`}
          />
          <input
            type="number"
            min={0}
            step={0.01}
            value={item.preco_unitario}
            onChange={(e) => updateItem(index, { preco_unitario: Number(e.target.value) })}
            className={`${INPUT_CLASS} w-24`}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="cursor-pointer text-sm font-medium text-electric-soft hover:underline"
      >
        + Item
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
      <div className="mt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'A submeter...' : 'Criar orçamento'}
        </button>
      </div>
    </div>
  );
}
