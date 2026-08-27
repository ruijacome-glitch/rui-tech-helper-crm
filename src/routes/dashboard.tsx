import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { apiFetch } from '@/lib/apiClient';

type DashboardData = {
  clientes: { total: number; novos_mes: number };
  intervencoes: { total: number; esta_semana: number };
  faturacao_mes: string;
  pendentes: number;
  agendamentos: { total: number };
  por_estado: Record<string, number>;
  intervencoes_recentes: { id: number; titulo: string; cliente_nome: string; estado: string; created_at: string }[];
};

const ESTADO_COLORS: Record<string, string> = {
  aberto: 'var(--color-info)',
  em_analise: 'var(--color-info)',
  em_curso: 'var(--color-warning)',
  aguarda_cliente: 'var(--color-waiting)',
  aguarda_peca: 'var(--color-waiting)',
  em_testes: 'var(--color-warning)',
  resolvido: 'var(--color-success)',
  cancelado: 'var(--color-error)',
};

function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="panel-tech p-5">
      <p className="label-tech text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Donut({ porEstado }: { porEstado: Record<string, number> }) {
  const entries = Object.entries(porEstado).filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados.</p>;
  }

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offsetAcc = 0;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="size-32 -rotate-90">
        {entries.map(([estado, count]) => {
          const fraction = count / total;
          const dash = fraction * circumference;
          const circle = (
            <circle
              key={estado}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={ESTADO_COLORS[estado] ?? 'var(--color-waiting)'}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offsetAcc}
            />
          );
          offsetAcc += dash;
          return circle;
        })}
      </svg>
      <ul className="space-y-1 text-sm">
        {entries.map(([estado, count]) => (
          <li key={estado} className="flex items-center gap-2 text-foreground/80">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: ESTADO_COLORS[estado] ?? 'var(--color-waiting)' }} />
            {estado} ({count})
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiFetch<DashboardData>('/api/admin/dashboard'),
  });

  if (isLoading) return <p className="label-tech text-muted-foreground">A carregar...</p>;
  if (error || !data) return <p role="alert" className="text-sm text-destructive">Erro ao carregar dashboard.</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Clientes" value={data.clientes.total} hint={`+${data.clientes.novos_mes} este mês`} />
        <KpiCard label="Intervenções" value={data.intervencoes.total} hint={`+${data.intervencoes.esta_semana} esta semana`} />
        <KpiCard label="Faturação (mês)" value={`${data.faturacao_mes}€`} />
        <KpiCard label="Pendentes" value={data.pendentes} />
        <div className="panel-tech p-5 opacity-60">
          <div className="flex items-center justify-between">
            <p className="label-tech text-muted-foreground">Agendamentos</p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">Em breve</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">{data.agendamentos.total}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel-tech p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Por estado</h2>
          <Donut porEstado={data.por_estado} />
        </div>

        <div className="panel-tech p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Intervenções recentes</h2>
          {data.intervencoes_recentes.length === 0 && <p className="text-sm text-muted-foreground">Sem intervenções recentes.</p>}
          <ul className="space-y-3">
            {data.intervencoes_recentes.map((item) => (
              <li key={item.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <div>
                  <Link to="/tickets/$ticketId" params={{ ticketId: String(item.id) }} className="font-medium text-electric-soft hover:underline">
                    {item.titulo}
                  </Link>
                  <p className="text-xs text-muted-foreground">{item.cliente_nome}</p>
                </div>
                <span className="text-xs text-muted-foreground">{item.estado}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
