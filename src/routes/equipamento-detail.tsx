import { useParams, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';

type EquipamentoDetail = {
  id: number;
  cliente_id: number;
  cliente_nome: string | null;
  tipo: string;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  notas: string | null;
};

type TicketSummary = {
  id: number;
  titulo: string;
  estado: string;
  created_at: string;
};

type EquipamentoShowResponse = {
  equipamento: EquipamentoDetail;
  tickets: TicketSummary[];
};

export function EquipamentoDetailPage() {
  const { equipamentoId } = useParams({ from: '/equipamentos/$equipamentoId' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['equipamento', equipamentoId],
    queryFn: () => apiFetch<EquipamentoShowResponse>(`/api/admin/equipamentos/${equipamentoId}`),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">A carregar...</p>;
  if (error || !data) return <p role="alert" className="text-sm text-destructive">Erro ao carregar equipamento.</p>;

  const { equipamento, tickets } = data;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-foreground">
        {[equipamento.marca, equipamento.modelo].filter(Boolean).join(' ') || 'Equipamento'}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        <Link to="/clientes/$clienteId" params={{ clienteId: String(equipamento.cliente_id) }} className="text-electric-soft hover:underline">
          {equipamento.cliente_nome ?? 'Cliente'}
        </Link>
      </p>

      <div className="panel-tech mb-6 grid grid-cols-2 gap-4 p-4 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Tipo</p>
          <p className="text-foreground">{equipamento.tipo}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Número de série</p>
          <p className="text-foreground">{equipamento.numero_serie ?? '—'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Notas</p>
          <p className="text-foreground/80">{equipamento.notas ?? '—'}</p>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-foreground">Histórico de tickets</h2>
      {tickets.length === 0 && <p className="text-sm text-muted-foreground">Sem tickets associados a este equipamento.</p>}
      {tickets.length > 0 && (
        <div className="panel-tech overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                  <td className="px-4 py-3">
                    <Link to="/tickets/$ticketId" params={{ ticketId: String(t.id) }} className="font-medium text-electric-soft hover:underline">
                      {t.titulo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground/80">{t.estado}</td>
                  <td className="px-4 py-3 text-foreground/80">{new Date(t.created_at).toLocaleDateString('pt-PT')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
