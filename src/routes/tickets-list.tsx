import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { apiFetch } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';

type TicketRow = {
  id: number;
  titulo: string;
  estado: string;
  categoria: string;
  prioridade: string;
  cliente_id: number;
  tecnico_id: number | null;
};

type TicketsPage = { data: TicketRow[]; meta: { current_page: number; last_page: number; total: number } };

const ESTADOS = ['aberto', 'em_analise', 'em_curso', 'aguarda_cliente', 'aguarda_peca', 'em_testes', 'resolvido', 'cancelado'];
const CATEGORIAS = ['hardware', 'software', 'rede', 'backup'];
const PRIORIDADES = ['urgente', 'normal', 'baixa'];

export function TicketsListPage() {
  const { user } = useAuth();
  const [estado, setEstado] = useState('');
  const [categoria, setCategoria] = useState('');
  const [prioridade, setPrioridade] = useState('');

  const basePath = user?.role === 'admin' ? '/api/admin/tickets' : '/api/tecnico/tickets';
  const params = new URLSearchParams();
  if (estado) params.set('estado', estado);
  if (categoria) params.set('categoria', categoria);
  if (prioridade) params.set('prioridade', prioridade);
  const query = params.toString();

  const { data, isLoading, error } = useQuery({
    queryKey: ['tickets', basePath, estado, categoria, prioridade],
    queryFn: () => apiFetch<TicketsPage>(`${basePath}${query ? `?${query}` : ''}`),
  });

  return (
    <div>
      <h1>Tickets</h1>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos os estados</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
          <option value="">Todas as prioridades</option>
          {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {isLoading && <p>A carregar...</p>}
      {error && <p role="alert">Erro ao carregar tickets.</p>}
      {data && (
        <table>
          <thead>
            <tr><th>Título</th><th>Estado</th><th>Categoria</th><th>Prioridade</th></tr>
          </thead>
          <tbody>
            {data.data.map((ticket) => (
              <tr key={ticket.id}>
                <td><Link to="/tickets/$ticketId" params={{ ticketId: String(ticket.id) }}>{ticket.titulo}</Link></td>
                <td>{ticket.estado}</td>
                <td>{ticket.categoria}</td>
                <td>{ticket.prioridade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {data && data.data.length === 0 && <p>Nenhum ticket encontrado.</p>}
    </div>
  );
}
