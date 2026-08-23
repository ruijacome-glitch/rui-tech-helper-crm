import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';
import { EmptyState } from '@/components/table/TableParts';

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
  const [tab, setTab] = useState<Tab>('Resumo');

  const { data, isLoading, error } = useQuery({
    queryKey: ['cliente', clienteId],
    queryFn: () => apiFetch<ClienteDetail>(`/api/admin/clientes/${clienteId}`),
  });

  if (isLoading) return <p className="label-tech text-muted-foreground">A carregar...</p>;
  if (error || !data) return <p role="alert" className="text-sm text-destructive">Erro ao carregar cliente.</p>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{data.cliente.nome}</h1>
        <p className="text-sm text-muted-foreground">
          {[data.cliente.email, data.cliente.telefone, data.cliente.morada, data.cliente.nif].filter(Boolean).join(' · ') || 'Sem dados de contacto.'}
        </p>
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
