import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { OrcamentoForm } from './orcamento-form';

type TicketDetail = {
  id: number;
  titulo: string;
  descricao: string;
  estado: string;
  categoria: string;
  prioridade: string;
  cliente: { id: number; nome: string; email: string; telefone: string };
  tecnico: { id: number; name: string } | null;
  eventos: { estado_anterior: string; estado_novo: string; observacao: string | null; created_at: string }[];
  anexos: { id: number; nome_original: string; content_type: string; size: number }[];
  orcamentos: { id: number; versao: number; estado: string; itens: { descricao: string; quantidade: number; preco_unitario: number }[] }[];
};

type Tecnico = { id: number; name: string };

const ESTADOS = ['aberto', 'em_analise', 'em_curso', 'aguarda_cliente', 'aguarda_peca', 'em_testes', 'resolvido', 'cancelado'];

export function TicketDetailPage() {
  const { ticketId } = useParams({ from: '/tickets/$ticketId' });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const basePath = user?.role === 'admin' ? '/api/admin' : '/api/tecnico';
  const [showOrcamentoForm, setShowOrcamentoForm] = useState(false);

  const ticketQuery = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => apiFetch<{ ticket: TicketDetail }>(`${basePath}/tickets/${ticketId}`),
  });

  const tecnicosQuery = useQuery({
    queryKey: ['tecnicos'],
    queryFn: () => apiFetch<{ tecnicos: Tecnico[] }>('/api/admin/tecnicos'),
    enabled: user?.role === 'admin',
  });

  async function handleMudarEstado(novoEstado: string) {
    await apiFetch(`${basePath}/tickets/${ticketId}/estado`, { method: 'PATCH', body: { estado: novoEstado } });
    queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
  }

  async function handleAtribuir(tecnicoId: number) {
    await apiFetch(`/api/admin/tickets/${ticketId}/atribuir`, { method: 'PATCH', body: { tecnico_id: tecnicoId } });
    queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
  }

  if (ticketQuery.isLoading) return <p>A carregar...</p>;
  if (ticketQuery.error || !ticketQuery.data) return <p role="alert">Erro ao carregar ticket.</p>;

  const ticket = ticketQuery.data.ticket;

  return (
    <div>
      <h1>{ticket.titulo}</h1>
      <p>{ticket.descricao}</p>
      <p>Estado: <strong>{ticket.estado}</strong> · Categoria: {ticket.categoria} · Prioridade: {ticket.prioridade}</p>
      <p>Cliente: {ticket.cliente.nome} ({ticket.cliente.email})</p>
      <p>Técnico: {ticket.tecnico?.name ?? 'Não atribuído'}</p>

      <section>
        <h2>Mudar estado</h2>
        <select onChange={(e) => e.target.value && handleMudarEstado(e.target.value)} defaultValue="">
          <option value="" disabled>Selecionar novo estado</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </section>

      {user?.role === 'admin' && (
        <section>
          <h2>Atribuir técnico</h2>
          <select onChange={(e) => e.target.value && handleAtribuir(Number(e.target.value))} defaultValue="">
            <option value="" disabled>Selecionar técnico</option>
            {tecnicosQuery.data?.tecnicos.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </section>
      )}

      <section>
        <h2>Timeline</h2>
        <ul>
          {ticket.eventos.map((evento, i) => (
            <li key={i}>{evento.created_at}: {evento.estado_anterior} → {evento.estado_novo}{evento.observacao ? ` — ${evento.observacao}` : ''}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Anexos</h2>
        <ul>
          {ticket.anexos.map((anexo) => <li key={anexo.id}>{anexo.nome_original} ({anexo.content_type}, {anexo.size} bytes)</li>)}
        </ul>
      </section>

      <section>
        <h2>Orçamentos</h2>
        {ticket.orcamentos.map((orcamento) => (
          <div key={orcamento.id}>
            <p>v{orcamento.versao} — {orcamento.estado}</p>
            <ul>
              {orcamento.itens.map((item, i) => <li key={i}>{item.descricao} × {item.quantidade} @ {item.preco_unitario}€</li>)}
            </ul>
          </div>
        ))}
        {!showOrcamentoForm && <button onClick={() => setShowOrcamentoForm(true)}>+ Novo orçamento</button>}
        {showOrcamentoForm && (
          <OrcamentoForm
            basePath={basePath}
            ticketId={ticket.id}
            onCreated={() => {
              setShowOrcamentoForm(false);
              queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
            }}
          />
        )}
      </section>
    </div>
  );
}
