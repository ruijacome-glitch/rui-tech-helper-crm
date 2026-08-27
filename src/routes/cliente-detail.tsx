import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/lib/apiClient';
import { EmptyState } from '@/components/table/TableParts';
import { DialogRoot, DialogTrigger, DialogContent } from '@/components/ui/Dialog';
import { EditarClienteForm } from '@/components/EditarClienteForm';

type ClienteDetail = {
  cliente: { id: number; nome: string; email: string | null; telefone: string | null; morada: string | null; nif: string | null; notas: string | null };
  resumo: { intervencoes_total: number; faturacao_total: string; ultima_intervencao_em: string | null };
  intervencoes: { id: number; titulo: string; estado: string; categoria: string; prioridade: string; created_at: string }[];
  orcamentos: { id: number; ticket_id: number; valor_total: string; estado: string; created_at: string }[];
};

const TABS = ['Resumo', 'Intervenções', 'Equipamentos', 'Faturas', 'Orçamentos', 'Documentos', 'Comunicações'] as const;
type Tab = (typeof TABS)[number];

export function ClienteDetailPage() {
  const { clienteId } = useParams({ from: '/clientes/$clienteId' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('Resumo');
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['cliente', clienteId],
    queryFn: () => apiFetch<ClienteDetail>(`/api/admin/clientes/${clienteId}`),
  });

  const reenviarConvite = useMutation({
    mutationFn: () => apiFetch<{ message: string }>(`/api/admin/clientes/${clienteId}/reenviar-convite`, { method: 'POST' }),
    onSuccess: () => toast.success('Convite reenviado.'),
    onError: (err) =>
      toast.error(err instanceof ApiError && err.status === 422 ? 'Cliente sem email definido.' : 'Erro ao reenviar convite.'),
  });

  const apagarCliente = useMutation({
    mutationFn: () => apiFetch<{ message: string }>(`/api/admin/clientes/${clienteId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente apagado.');
      navigate({ to: '/clientes' });
    },
    onError: (err) => {
      const message =
        err instanceof ApiError && err.body && typeof err.body === 'object' && 'message' in err.body
          ? String((err.body as { message: unknown }).message)
          : 'Erro ao apagar cliente.';
      toast.error(message);
    },
  });

  function handleApagar() {
    if (window.confirm('Apagar este cliente? Esta acção não pode ser desfeita.')) {
      apagarCliente.mutate();
    }
  }

  if (isLoading) return <p className="label-tech text-muted-foreground">A carregar...</p>;
  if (error || !data) return <p role="alert" className="text-sm text-destructive">Erro ao carregar cliente.</p>;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{data.cliente.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {[data.cliente.email, data.cliente.telefone, data.cliente.morada, data.cliente.nif].filter(Boolean).join(' · ') || 'Sem dados de contacto.'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <DialogRoot open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger className="flex h-9 cursor-pointer items-center justify-center whitespace-nowrap rounded-md border border-input bg-secondary px-3 text-sm font-medium text-foreground transition-opacity hover:opacity-90">
                Editar
              </DialogTrigger>
              <DialogContent title="Editar cliente">
                <EditarClienteForm cliente={data.cliente} onSaved={() => setEditOpen(false)} />
              </DialogContent>
            </DialogRoot>
            <button
              type="button"
              disabled={!data.cliente.email || reenviarConvite.isPending}
              onClick={() => reenviarConvite.mutate()}
              title={!data.cliente.email ? 'Cliente sem email definido.' : undefined}
              className="flex h-9 cursor-pointer items-center justify-center whitespace-nowrap rounded-md border border-input bg-secondary px-3 text-sm font-medium text-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reenviarConvite.isPending ? 'A reenviar...' : 'Reenviar convite'}
            </button>
            <button
              type="button"
              disabled={apagarCliente.isPending}
              onClick={handleApagar}
              className="flex h-9 cursor-pointer items-center justify-center whitespace-nowrap rounded-md border border-destructive/40 bg-secondary px-3 text-sm font-medium text-destructive transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {apagarCliente.isPending ? 'A apagar...' : 'Apagar'}
            </button>
          </div>
          {reenviarConvite.isSuccess && <p className="text-xs text-electric-soft">Convite reenviado.</p>}
          {reenviarConvite.isError && (
            <p role="alert" className="text-xs text-destructive">
              {reenviarConvite.error instanceof ApiError && reenviarConvite.error.status === 422
                ? 'Cliente sem email definido.'
                : 'Erro ao reenviar convite.'}
            </p>
          )}
        </div>
      </div>

      <div role="tablist" className="mb-6 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            id={`tab-${t}`}
            aria-controls={`tabpanel-${t}`}
            onClick={() => setTab(t)}
            className={`cursor-pointer border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'border-electric-soft text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`tabpanel-${tab}`} aria-labelledby={`tab-${tab}`}>
      {tab === 'Resumo' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="panel-tech p-5">
            <p className="label-tech text-muted-foreground">Intervenções</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{data.resumo.intervencoes_total}</p>
          </div>
          <div className="panel-tech p-5">
            <p className="label-tech text-muted-foreground">Faturação total</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{data.resumo.faturacao_total}€</p>
          </div>
          <div className="panel-tech p-5">
            <p className="label-tech text-muted-foreground">Última intervenção</p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {data.resumo.ultima_intervencao_em ? new Date(data.resumo.ultima_intervencao_em).toLocaleDateString('pt-PT') : '—'}
            </p>
          </div>
        </div>
      )}

      {tab === 'Intervenções' && (
        data.intervencoes.length === 0 ? (
          <EmptyState message="Sem intervenções." />
        ) : (
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
                {data.intervencoes.map((i) => (
                  <tr key={i.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground/80">{i.titulo}</td>
                    <td className="px-4 py-3 text-foreground/80">{i.estado}</td>
                    <td className="px-4 py-3 text-foreground/80">{i.categoria}</td>
                    <td className="px-4 py-3 text-foreground/80">{i.prioridade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'Orçamentos' && (
        data.orcamentos.length === 0 ? (
          <EmptyState message="Sem orçamentos." />
        ) : (
          <div className="panel-tech overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Ticket</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.orcamentos.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground/80">#{o.ticket_id}</td>
                    <td className="px-4 py-3 text-foreground/80">{o.valor_total}€</td>
                    <td className="px-4 py-3 text-foreground/80">{o.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'Equipamentos' && <EmptyState message="Módulo em breve." />}
      {tab === 'Faturas' && <EmptyState message="Módulo em breve." />}
      {tab === 'Documentos' && <EmptyState message="Módulo em breve." />}
      {tab === 'Comunicações' && <EmptyState message="Módulo em breve." />}
      </div>
    </div>
  );
}
