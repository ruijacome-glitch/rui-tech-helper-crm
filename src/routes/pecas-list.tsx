import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';
import { TableSkeleton, EmptyState, CIRCLE_ALERT_ICON_PATH } from '@/components/table/TableParts';
import { DialogRoot, DialogTrigger, DialogContent } from '@/components/ui/Dialog';
import { NovaPecaForm } from '@/components/NovaPecaForm';

type PecaRow = {
  id: number;
  nome: string;
  preco_custo: string;
  preco_venda: string;
  quantidade_atual: number;
  stock_minimo: number;
  stock_baixo: boolean;
};

type PecasPage = { data: PecaRow[]; meta: { current_page: number; last_page: number; total: number } };

export function PecasListPage() {
  const [search, setSearch] = useState('');
  const [stockBaixo, setStockBaixo] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (stockBaixo) params.set('stock_baixo', '1');
  const query = params.toString();

  const { data, isLoading, error } = useQuery({
    queryKey: ['pecas', search, stockBaixo],
    queryFn: () => apiFetch<PecasPage>(`/api/admin/pecas${query ? `?${query}` : ''}`),
  });

  async function handleMovimento(id: number, tipo: 'entrada' | 'saida') {
    const quantidade = window.prompt(tipo === 'entrada' ? 'Quantidade a entrar:' : 'Quantidade a sair:');
    if (!quantidade || Number(quantidade) <= 0) return;
    await apiFetch(`/api/admin/pecas/${id}/movimentar`, { method: 'POST', body: { tipo, quantidade: Number(quantidade) } });
    queryClient.invalidateQueries({ queryKey: ['pecas'] });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Peças e Stock</h1>
        <DialogRoot open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="flex h-11 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            + Nova Peça
          </DialogTrigger>
          <DialogContent title="Nova Peça">
            <NovaPecaForm onCreated={() => setDialogOpen(false)} />
          </DialogContent>
        </DialogRoot>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Procurar peça..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/80">
          <input type="checkbox" checked={stockBaixo} onChange={(e) => setStockBaixo(e.target.checked)} />
          Só stock baixo
        </label>
      </div>

      {isLoading && <TableSkeleton cols={6} />}
      {error && <p role="alert" className="text-sm text-destructive">Erro ao carregar peças.</p>}
      {data && data.data.length === 0 && <EmptyState message="Nenhuma peça encontrada." iconPath={CIRCLE_ALERT_ICON_PATH} />}
      {data && data.data.length > 0 && (
        <div className="panel-tech overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Custo</th>
                <th className="px-4 py-3 font-medium">Venda</th>
                <th className="px-4 py-3 font-medium">Quantidade</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                  <td className="px-4 py-3 font-medium text-foreground">{p.nome}</td>
                  <td className="px-4 py-3 text-foreground/80">{p.preco_custo}€</td>
                  <td className="px-4 py-3 text-foreground/80">{p.preco_venda}€</td>
                  <td className="px-4 py-3 text-foreground/80">{p.quantidade_atual}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.stock_baixo ? 'bg-error/15 text-error-soft' : 'bg-success/15 text-success-soft'}`}>
                      {p.stock_baixo ? 'Stock baixo' : 'OK'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMovimento(p.id, 'entrada')}
                        className="cursor-pointer rounded-md bg-success/15 px-3 py-1.5 text-xs font-semibold text-success-soft transition-opacity hover:opacity-90"
                      >
                        + Entrada
                      </button>
                      <button
                        onClick={() => handleMovimento(p.id, 'saida')}
                        className="cursor-pointer rounded-md bg-warning/15 px-3 py-1.5 text-xs font-semibold text-warning-soft transition-opacity hover:opacity-90"
                      >
                        − Saída
                      </button>
                    </div>
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
