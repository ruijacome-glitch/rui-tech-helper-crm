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

const SELECT_CLASS =
  'rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel-tech mt-6 p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

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

  if (ticketQuery.isLoading) return <p className="label-tech text-muted-foreground">A carregar...</p>;
  if (ticketQuery.error || !ticketQuery.data) return <p role="alert" className="text-sm text-destructive">Erro ao carregar ticket.</p>;

  const ticket = ticketQuery.data.ticket;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{ticket.titulo}</h1>
      <p className="mt-2 text-foreground/80">{ticket.descricao}</p>
      <p className="mt-3 text-sm text-muted-foreground">
        Estado: <strong className="text-foreground">{ticket.estado}</strong> · Categoria: {ticket.categoria} · Prioridade: {ticket.prioridade}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">Cliente: {ticket.cliente.nome} ({ticket.cliente.email})</p>
      <p className="mt-1 text-sm text-muted-foreground">Técnico: {ticket.tecnico?.name ?? 'Não atribuído'}</p>

      <Section title="Mudar estado">
        <select onChange={(e) => e.target.value && handleMudarEstado(e.target.value)} defaultValue="" className={SELECT_CLASS}>
          <option value="" disabled>Selecionar novo estado</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </Section>

      {user?.role === 'admin' && (
        <Section title="Atribuir técnico">
          <select onChange={(e) => e.target.value && handleAtribuir(Number(e.target.value))} defaultValue="" className={SELECT_CLASS}>
            <option value="" disabled>Selecionar técnico</option>
            {tecnicosQuery.data?.tecnicos.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Section>
      )}

      <Section title="Timeline">
        <ul className="flex flex-col gap-2 text-sm text-foreground/80">
          {ticket.eventos.map((evento, i) => (
            <li key={i} className="border-b border-border pb-2 last:border-0">
              <span className="text-muted-foreground">{evento.created_at}:</span> {evento.estado_anterior} → {evento.estado_novo}
              {evento.observacao ? ` — ${evento.observacao}` : ''}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Anexos">
        <ul className="flex flex-col gap-2 text-sm text-foreground/80">
          {ticket.anexos.map((anexo) => (
            <li key={anexo.id}>{anexo.nome_original} ({anexo.content_type}, {anexo.size} bytes)</li>
          ))}
          {ticket.anexos.length === 0 && <li className="text-muted-foreground">Sem anexos.</li>}
        </ul>
      </Section>

      <Section title="Orçamentos">
        {ticket.orcamentos.map((orcamento) => (
          <div key={orcamento.id} className="mb-4 rounded-md border border-border p-4 last:mb-0">
            <p className="mb-2 text-sm font-medium text-foreground">v{orcamento.versao} — {orcamento.estado}</p>
            <ul className="text-sm text-foreground/80">
              {orcamento.itens.map((item, i) => (
                <li key={i}>{item.descricao} × {item.quantidade} @ {item.preco_unitario}€</li>
              ))}
            </ul>
          </div>
        ))}
        {!showOrcamentoForm && (
          <button
            onClick={() => setShowOrcamentoForm(true)}
            className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            + Novo orçamento
          </button>
        )}
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
      </Section>
    </div>
  );
}
