import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';

type PagamentoRow = {
  id: number;
  estado: string;
  metodo: string | null;
  valor: number;
  orcamento: { id: number; ticket: { id: number; titulo: string } };
};

type PagamentosPage = { data: PagamentoRow[] };

const ESTADOS = ['pendente', 'pago', 'expirado', 'cancelado'];

const ESTADO_BADGE: Record<string, string> = {
  pendente: 'bg-orange/15 text-orange',
  pago: 'bg-electric/15 text-electric-soft',
  expirado: 'bg-muted text-muted-foreground',
  cancelado: 'bg-destructive/15 text-destructive',
};

export function PagamentosListPage() {
  const [estado, setEstado] = useState('');
  const queryClient = useQueryClient();

  const query = estado ? `?estado=${estado}` : '';
  const { data, isLoading, error } = useQuery({
    queryKey: ['pagamentos', estado],
    queryFn: () => apiFetch<PagamentosPage>(`/api/admin/pagamentos${query}`),
  });

  async function handleMarcarPago(orcamentoId: number) {
    await apiFetch(`/api/admin/orcamentos/${orcamentoId}/pagamento/marcar-pago`, { method: 'POST' });
    queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Pagamentos</h1>
      <select
        value={estado}
        onChange={(e) => setEstado(e.target.value)}
        className="mb-6 rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft"
      >
        <option value="">Todos os estados</option>
        {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
      </select>

      {isLoading && <p className="label-tech text-muted-foreground">A carregar...</p>}
      {error && <p role="alert" className="text-sm text-destructive">Erro ao carregar pagamentos.</p>}
      {data && (
        <div className="panel-tech overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Ticket</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Método</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((pagamento) => (
                <tr key={pagamento.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                  <td className="px-4 py-3 text-foreground/80">{pagamento.orcamento.ticket.titulo}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[pagamento.estado] ?? 'bg-muted text-muted-foreground'}`}>
                      {pagamento.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground/80">{pagamento.metodo ?? '—'}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{pagamento.valor}€</td>
                  <td className="px-4 py-3">
                    {pagamento.estado === 'pendente' && (
                      <button
                        onClick={() => handleMarcarPago(pagamento.orcamento.id)}
                        className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        Marcar pago
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && data.data.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pagamento encontrado.</p>}
    </div>
  );
}
