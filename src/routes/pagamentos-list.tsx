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
      <h1>Pagamentos</h1>
      <select value={estado} onChange={(e) => setEstado(e.target.value)}>
        <option value="">Todos os estados</option>
        {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
      </select>

      {isLoading && <p>A carregar...</p>}
      {error && <p role="alert">Erro ao carregar pagamentos.</p>}
      {data && (
        <table>
          <thead>
            <tr><th>Ticket</th><th>Estado</th><th>Método</th><th>Valor</th><th></th></tr>
          </thead>
          <tbody>
            {data.data.map((pagamento) => (
              <tr key={pagamento.id}>
                <td>{pagamento.orcamento.ticket.titulo}</td>
                <td>{pagamento.estado}</td>
                <td>{pagamento.metodo ?? '—'}</td>
                <td>{pagamento.valor}€</td>
                <td>
                  {pagamento.estado === 'pendente' && (
                    <button onClick={() => handleMarcarPago(pagamento.orcamento.id)}>Marcar pago</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {data && data.data.length === 0 && <p>Nenhum pagamento encontrado.</p>}
    </div>
  );
}
