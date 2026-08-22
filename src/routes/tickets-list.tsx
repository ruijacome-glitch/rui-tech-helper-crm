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

const SELECT_CLASS =
  'rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft';

const PRIORIDADE_BADGE: Record<string, string> = {
  urgente: 'bg-destructive/15 text-destructive',
  normal: 'bg-electric/15 text-electric-soft',
  baixa: 'bg-muted text-muted-foreground',
};

const ESTADO_BADGE: Record<string, string> = {
  aberto: 'bg-orange/15 text-orange',
  em_analise: 'bg-orange/15 text-orange',
  em_curso: 'bg-electric/15 text-electric-soft',
  aguarda_cliente: 'bg-muted text-muted-foreground',
  aguarda_peca: 'bg-muted text-muted-foreground',
  em_testes: 'bg-electric/15 text-electric-soft',
  resolvido: 'bg-electric/15 text-electric-soft',
  cancelado: 'bg-destructive/15 text-destructive',
};

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <div className="panel-tech overflow-hidden">
      {Array.from({ length: 5 }).map((_, row) => (
        <div key={row} className="flex gap-6 border-b border-border px-4 py-3.5 last:border-0">
          {Array.from({ length: cols }).map((_, col) => (
            <div key={col} className="h-4 flex-1 animate-pulse rounded bg-secondary" />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="panel-tech flex flex-col items-center gap-2 px-6 py-16 text-center">
      <svg viewBox="0 0 24 24" className="size-10 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-6 4h6M9 5h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      </svg>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

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
      <h1 className="mb-6 text-2xl font-bold text-foreground">Tickets</h1>
      <div className="mb-6 flex flex-wrap gap-3">
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className={SELECT_CLASS}>
          <option value="">Todos os estados</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={SELECT_CLASS}>
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)} className={SELECT_CLASS}>
          <option value="">Todas as prioridades</option>
          {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {isLoading && <TableSkeleton cols={4} />}
      {error && <p role="alert" className="text-sm text-destructive">Erro ao carregar tickets.</p>}
      {data && data.data.length === 0 && <EmptyState message="Nenhum ticket encontrado." />}
      {data && data.data.length > 0 && (
        <div className="panel-tech overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Prioridade</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((ticket) => (
                <tr key={ticket.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                  <td className="px-4 py-3">
                    <Link to="/tickets/$ticketId" params={{ ticketId: String(ticket.id) }} className="font-medium text-electric-soft hover:underline">
                      {ticket.titulo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[ticket.estado] ?? 'bg-muted text-muted-foreground'}`}>
                      {ticket.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground/80">{ticket.categoria}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORIDADE_BADGE[ticket.prioridade] ?? 'bg-muted text-muted-foreground'}`}>
                      {ticket.prioridade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
