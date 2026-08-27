import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { apiFetch } from '@/lib/apiClient';
import { TableSkeleton, EmptyState } from '@/components/table/TableParts';
import { DialogRoot, DialogTrigger, DialogContent } from '@/components/ui/Dialog';
import { NovoClienteForm } from '@/components/NovoClienteForm';

type ClienteRow = {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  intervencoes_count: number;
};

type ClientesPage = { data: ClienteRow[]; meta: { current_page: number; last_page: number; total: number } };

export function ClientesListPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['clientes', search],
    queryFn: () => apiFetch<ClientesPage>(`/api/admin/clientes${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
        <DialogRoot open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="flex h-11 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            + Novo Cliente
          </DialogTrigger>
          <DialogContent title="Novo Cliente">
            <NovoClienteForm onCreated={() => setDialogOpen(false)} />
          </DialogContent>
        </DialogRoot>
      </div>
      <input
        type="search"
        aria-label="Pesquisar clientes"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Pesquisar por nome, email ou telefone..."
        className="mb-6 w-full max-w-sm rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft"
      />

      {isLoading && <TableSkeleton cols={4} />}
      {error && <p role="alert" className="text-sm text-destructive">Erro ao carregar clientes.</p>}
      {data && data.data.length === 0 && <EmptyState message="Nenhum cliente encontrado." />}
      {data && data.data.length > 0 && (
        <div className="panel-tech overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Intervenções</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((cliente) => (
                <tr key={cliente.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                  <td className="px-4 py-3">
                    <Link to="/clientes/$clienteId" params={{ clienteId: String(cliente.id) }} className="font-medium text-electric-soft hover:underline">
                      {cliente.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground/80">{cliente.email ?? '—'}</td>
                  <td className="px-4 py-3 text-foreground/80">{cliente.telefone ?? '—'}</td>
                  <td className="px-4 py-3 text-foreground/80">{cliente.intervencoes_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
