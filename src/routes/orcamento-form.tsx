import { useState } from 'react';
import { apiFetch } from '@/lib/apiClient';

type Item = { descricao: string; quantidade: number; preco_unitario: number };

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
    <div style={{ border: '1px solid #ddd', padding: '12px', marginTop: '12px' }}>
      <h3>Novo orçamento</h3>
      {itens.map((item, index) => (
        <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input placeholder="Descrição" value={item.descricao} onChange={(e) => updateItem(index, { descricao: e.target.value })} />
          <input type="number" min={1} value={item.quantidade} onChange={(e) => updateItem(index, { quantidade: Number(e.target.value) })} style={{ width: '80px' }} />
          <input type="number" min={0} step={0.01} value={item.preco_unitario} onChange={(e) => updateItem(index, { preco_unitario: Number(e.target.value) })} style={{ width: '100px' }} />
        </div>
      ))}
      <button type="button" onClick={addItem}>+ Item</button>
      {error && <p role="alert">{error}</p>}
      <div>
        <button type="button" onClick={handleSubmit} disabled={submitting}>{submitting ? 'A submeter...' : 'Criar orçamento'}</button>
      </div>
    </div>
  );
}
