import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { apiFetch } from '@/lib/apiClient';
import { TableSkeleton, EmptyState } from '@/components/table/TableParts';
import { DialogRoot, DialogTrigger, DialogContent } from '@/components/ui/Dialog';
import { NovoEquipamentoForm } from '@/components/NovoEquipamentoForm';

type EquipamentoRow = {
  id: number;
  cliente_nome: string | null;
  tipo: string;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  tickets_count: number | null;
};

type EquipamentosPage = { data: EquipamentoRow[]; meta: { current_page: number; last_page: number; total: number } };

export function EquipamentosListPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const { data, isLoading, error } = useQuery({
    queryKey: ['equipamentos', search],
    queryFn: () => apiFetch<EquipamentosPage>(`/api/admin/equipamentos${query}`),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Equipamentos</h1>
        <DialogRoot open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="flex h-11 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            + Novo Equipamento
          </DialogTrigger>
          <DialogContent title="Novo Equipamento">
            <NovoEquipamentoForm onCreated={() => setDialogOpen(false)} />
          </DialogContent>
        </DialogRoot>
      </div>

      <input
        type="text"
        placeholder="Procurar por marca, modelo ou número de série..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 w-full max-w-md rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft"
      />

      {isLoading && <TableSkeleton cols={5} />}
      {error && <p role="alert" className="text-sm text-destructive">Erro ao carregar equipamentos.</p>}
      {data && data.data.length === 0 && <EmptyState message="Nenhum equipamento encontrado." />}
      {data && data.data.length > 0 && (
        <div className="panel-tech overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Marca/Modelo</th>
                <th className="px-4 py-3 font-medium">Nº série</th>
                <th className="px-4 py-3 font-medium">Tickets</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((eq) => (
                <tr key={eq.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                  <td className="px-4 py-3">
                    <Link to="/equipamentos/$equipamentoId" params={{ equipamentoId: String(eq.id) }} className="font-medium text-electric-soft hover:underline">
                      {eq.cliente_nome ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground/80">{eq.tipo}</td>
                  <td className="px-4 py-3 text-foreground/80">{[eq.marca, eq.modelo].filter(Boolean).join(' ') || '—'}</td>
                  <td className="px-4 py-3 text-foreground/80">{eq.numero_serie ?? '—'}</td>
                  <td className="px-4 py-3 text-foreground/80">{eq.tickets_count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
