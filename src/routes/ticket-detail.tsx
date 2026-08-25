import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { OrcamentoForm } from './orcamento-form';
import { Stepper } from '@/components/Stepper';
import { IssuesSection } from '@/components/IssuesSection';
import { ChecklistSection } from '@/components/ChecklistSection';
import { TrackingLinkBlock } from '@/components/TrackingLinkBlock';

type TicketIssue = {
  id: number;
  descricao: string;
  resultado: 'pendente' | 'resolvido' | 'nao_resolvido';
  observacao: string | null;
  resolvido_por: string | null;
  resolvido_at: string | null;
};

type ChecklistItem = {
  item_chave: string;
  label: string;
  concluido: boolean;
  concluido_por: string | null;
  concluido_at: string | null;
};

type TicketDetail = {
  id: number;
  titulo: string;
  descricao: string;
  estado: string;
  categoria: string;
  prioridade: string;
  tracking_token: string;
  cliente: { id: number; nome: string; email: string; telefone: string };
  tecnico: { id: number; name: string } | null;
  eventos: { estado_anterior: string; estado_novo: string; observacao: string | null; created_at: string }[];
  anexos: { id: number; nome_original: string; content_type: string; size: number }[];
  orcamentos: { id: number; versao: number; estado: string; itens: { descricao: string; quantidade: number; preco_unitario: number }[] }[];
  issues: TicketIssue[];
  checklist: ChecklistItem[];
};

type Tecnico = { id: number; name: string };

const ESTADOS_SEQUENCIA = [
  { value: 'recebido', label: 'Recebido' },
  { value: 'em_diagnostico', label: 'Em Diagnóstico' },
  { value: 'aguarda_pecas', label: 'Aguarda Peças' },
  { value: 'em_reparacao', label: 'Em Reparação' },
  { value: 'reparacao_concluida', label: 'Reparação Concluída' },
  { value: 'pronto_levantamento', label: 'Pronto p/ Levantamento' },
  { value: 'entregue', label: 'Entregue' },
] as const;

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
  const [estadoError, setEstadoError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [atribuindo, setAtribuindo] = useState(false);
  const [atribuirError, setAtribuirError] = useState<string | null>(null);

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
    setEstadoError(null);
    setAdvancing(true);
    try {
      await apiFetch(`${basePath}/tickets/${ticketId}/estado`, { method: 'PATCH', body: { estado: novoEstado } });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const body = error.body as { message?: string } | undefined;
        setEstadoError(body?.message ?? 'Não foi possível avançar o estado.');
      } else {
        setEstadoError('Erro ao avançar o estado.');
      }
    } finally {
      setAdvancing(false);
    }
  }

  async function handleAtribuir(tecnicoId: number) {
    setAtribuirError(null);
    setAtribuindo(true);
    try {
      await apiFetch(`/api/admin/tickets/${ticketId}/atribuir`, { method: 'PATCH', body: { tecnico_id: tecnicoId } });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    } catch (error) {
      setAtribuirError('Erro ao atribuir técnico.');
    } finally {
      setAtribuindo(false);
    }
  }

  function invalidateTicket() {
    queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
  }

  if (ticketQuery.isLoading) return <p className="label-tech text-muted-foreground">A carregar...</p>;
  if (ticketQuery.error || !ticketQuery.data) return <p role="alert" className="text-sm text-destructive">Erro ao carregar ticket.</p>;

  const ticket = ticketQuery.data.ticket;
  const podeCancelar = ticket.estado !== 'entregue' && ticket.estado !== 'cancelado';

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{ticket.titulo}</h1>
      <p className="mt-2 text-foreground/80">{ticket.descricao}</p>
      <p className="mt-3 text-sm text-muted-foreground">
        Categoria: {ticket.categoria} · Prioridade: {ticket.prioridade}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">Cliente: {ticket.cliente.nome} ({ticket.cliente.email})</p>
      <p className="mt-1 text-sm text-muted-foreground">Técnico: {ticket.tecnico?.name ?? 'Não atribuído'}</p>

      <Section title="Estado">
        <Stepper steps={ESTADOS_SEQUENCIA} current={ticket.estado} onAdvance={handleMudarEstado} advancing={advancing} />
        {estadoError && <p role="alert" className="mt-2 text-sm text-destructive">{estadoError}</p>}
        {podeCancelar && (
          <button
            onClick={() => handleMudarEstado('cancelado')}
            className="mt-3 cursor-pointer rounded-md border border-destructive px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
          >
            Cancelar ticket
          </button>
        )}
      </Section>

      {user?.role === 'admin' && (
        <Section title="Atribuir técnico">
          <select
            onChange={(e) => e.target.value && handleAtribuir(Number(e.target.value))}
            defaultValue=""
            disabled={atribuindo}
            className={SELECT_CLASS}
          >
            <option value="" disabled>Selecionar técnico</option>
            {tecnicosQuery.data?.tecnicos.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {tecnicosQuery.error && <p role="alert" className="mt-2 text-sm text-destructive">Erro ao carregar técnicos.</p>}
          {atribuirError && <p role="alert" className="mt-2 text-sm text-destructive">{atribuirError}</p>}
        </Section>
      )}

      <Section title="Issues">
        <IssuesSection basePath={basePath} ticketId={ticket.id} issues={ticket.issues} onChanged={invalidateTicket} />
      </Section>

      <Section title={`Checklist diagnóstico — ${ticket.categoria}`}>
        <ChecklistSection
          basePath={basePath}
          ticketId={ticket.id}
          checklist={ticket.checklist}
          showGateWarning={ticket.estado === 'em_diagnostico'}
          onChanged={invalidateTicket}
        />
      </Section>

      <Section title="Link de tracking (cliente)">
        <TrackingLinkBlock trackingToken={ticket.tracking_token} clienteNome={ticket.cliente.nome} />
      </Section>

      <Section title="Timeline">
        <ul className="flex flex-col gap-2 text-sm text-foreground/80">
          {ticket.eventos.map((evento, i) => (
            <li key={i} className="border-b border-border pb-2 last:border-0">
              <span className="text-muted-foreground">{new Date(evento.created_at).toLocaleDateString('pt-PT')}:</span> {evento.estado_anterior} → {evento.estado_novo}
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
              invalidateTicket();
            }}
          />
        )}
      </Section>
    </div>
  );
}
