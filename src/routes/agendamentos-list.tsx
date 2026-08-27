import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';
import { TableSkeleton, EmptyState } from '@/components/table/TableParts';
import { DialogRoot, DialogTrigger, DialogContent } from '@/components/ui/Dialog';
import { NovoAgendamentoForm } from '@/components/NovoAgendamentoForm';

type AgendamentoRow = {
  id: number;
  cliente_nome: string | null;
  tecnico_nome: string | null;
  ticket_titulo: string | null;
  data_hora: string;
  morada: string | null;
  estado: string;
};

type AgendamentosPage = { data: AgendamentoRow[] };

const ESTADOS = ['marcado', 'confirmado', 'concluido', 'cancelado'];

const ESTADO_BADGE: Record<string, string> = {
  marcado: 'bg-info/15 text-info-soft',
  confirmado: 'bg-warning/15 text-warning-soft',
  concluido: 'bg-success/15 text-success-soft',
  cancelado: 'bg-error/15 text-error-soft',
};

const SELECT_CLASS =
  'rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft';

export function AgendamentosListPage() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['agendamentos', ano, mes],
    queryFn: () => apiFetch<AgendamentosPage>(`/api/admin/agendamentos?ano=${ano}&mes=${mes}`),
  });

  async function handleEstadoChange(id: number, estado: string) {
    await apiFetch(`/api/admin/agendamentos/${id}`, { method: 'PATCH', body: { estado } });
    queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
        <DialogRoot open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="flex h-11 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            + Novo Agendamento
          </DialogTrigger>
          <DialogContent title="Novo Agendamento">
            <NovoAgendamentoForm onCreated={() => setDialogOpen(false)} />
          </DialogContent>
        </DialogRoot>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className={SELECT_CLASS}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{new Date(2000, m - 1).toLocaleDateString('pt-PT', { month: 'long' })}</option>
          ))}
        </select>
        <select value={ano} onChange={(e) => setAno(Number(e.target.value))} className={SELECT_CLASS}>
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {isLoading && <TableSkeleton cols={6} />}
      {error && <p role="alert" className="text-sm text-destructive">Erro ao carregar agenda.</p>}
      {data && data.data.length === 0 && <EmptyState message="Nenhum agendamento neste mês." />}
      {data && data.data.length > 0 && (
        <div className="panel-tech overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Data/Hora</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Técnico</th>
                <th className="px-4 py-3 font-medium">Ticket</th>
                <th className="px-4 py-3 font-medium">Morada</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {new Date(a.data_hora).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">{a.cliente_nome ?? '—'}</td>
                  <td className="px-4 py-3 text-foreground/80">{a.tecnico_nome ?? '—'}</td>
                  <td className="px-4 py-3 text-foreground/80">{a.ticket_titulo ?? '—'}</td>
                  <td className="px-4 py-3 text-foreground/80">{a.morada ?? '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={a.estado}
                      onChange={(e) => handleEstadoChange(a.id, e.target.value)}
                      className={`rounded-full border-0 px-2 py-0.5 text-xs font-medium outline-none ${ESTADO_BADGE[a.estado] ?? 'bg-muted text-muted-foreground'}`}
                    >
                      {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
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
