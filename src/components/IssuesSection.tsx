import { useState } from 'react';
import { apiFetch } from '@/lib/apiClient';

type TicketIssue = {
  id: number;
  descricao: string;
  resultado: 'pendente' | 'resolvido' | 'nao_resolvido';
  observacao: string | null;
  resolvido_por: string | null;
  resolvido_at: string | null;
};

const BADGE_CLASS: Record<TicketIssue['resultado'], string> = {
  pendente: 'bg-amber-500 text-black',
  resolvido: 'bg-emerald-500 text-white',
  nao_resolvido: 'bg-destructive text-white',
};

const BADGE_LABEL: Record<TicketIssue['resultado'], string> = {
  pendente: 'PENDENTE',
  resolvido: 'RESOLVIDO',
  nao_resolvido: 'NÃO RESOLVIDO',
};

export function IssuesSection({
  basePath,
  ticketId,
  issues,
  onChanged,
}: {
  basePath: string;
  ticketId: number;
  issues: TicketIssue[];
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!descricao.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`${basePath}/tickets/${ticketId}/issues`, { method: 'POST', body: { descricao } });
      setDescricao('');
      setShowForm(false);
      onChanged();
    } catch {
      setError('Erro ao adicionar issue.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolver(issue: TicketIssue, resultado: 'resolvido' | 'nao_resolvido') {
    setResolvingId(issue.id);
    setError(null);
    try {
      await apiFetch(`${basePath}/tickets/${ticketId}/issues/${issue.id}`, { method: 'PATCH', body: { resultado } });
      onChanged();
    } catch {
      setError('Erro ao atualizar issue.');
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div>
      {issues.map((issue) => (
        <div key={issue.id} className="mb-2 flex items-center justify-between rounded-md bg-background p-3 last:mb-0">
          <div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${BADGE_CLASS[issue.resultado]}`}>
              {BADGE_LABEL[issue.resultado]}
            </span>
            <p className="mt-1.5 text-sm text-foreground">{issue.descricao}</p>
            {issue.resolvido_por && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                por {issue.resolvido_por}, {issue.resolvido_at ? new Date(issue.resolvido_at).toLocaleDateString('pt-PT') : '—'}
              </p>
            )}
          </div>
          {issue.resultado === 'pendente' && (
            <div className="flex gap-1.5">
              <button
                onClick={() => handleResolver(issue, 'resolvido')}
                disabled={resolvingId === issue.id}
                className="cursor-pointer rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Resolvido
              </button>
              <button
                onClick={() => handleResolver(issue, 'nao_resolvido')}
                disabled={resolvingId === issue.id}
                className="cursor-pointer rounded-md bg-destructive px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Não resolvido
              </button>
            </div>
          )}
        </div>
      ))}
      {issues.length === 0 && <p className="text-sm text-muted-foreground">Sem issues registadas.</p>}
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mt-3 cursor-pointer text-sm font-medium text-electric-soft hover:underline"
        >
          + Adicionar issue
        </button>
      )}
      {showForm && (
        <div className="mt-3 flex gap-2">
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição do problema"
            className="flex-1 rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft"
          />
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="cursor-pointer rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            Adicionar
          </button>
        </div>
      )}
    </div>
  );
}
