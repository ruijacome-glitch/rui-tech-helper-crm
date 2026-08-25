import { useState } from 'react';
import { apiFetch, ApiError } from '@/lib/apiClient';

type ChecklistItem = {
  item_chave: string;
  label: string;
  concluido: boolean;
  concluido_por: string | null;
  concluido_at: string | null;
};

export function ChecklistSection({
  basePath,
  ticketId,
  checklist,
  showGateWarning,
  onChanged,
}: {
  basePath: string;
  ticketId: number;
  checklist: ChecklistItem[];
  showGateWarning: boolean;
  onChanged: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(item: ChecklistItem) {
    if (item.concluido) return;
    setError(null);
    try {
      await apiFetch(`${basePath}/tickets/${ticketId}/checklist/${item.item_chave}`, { method: 'PATCH' });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        onChanged();
        return;
      }
      setError('Erro ao atualizar checklist.');
      return;
    }
    onChanged();
  }

  return (
    <div>
      {showGateWarning && (
        <p className="mb-2 text-xs text-amber-500">⚠ Completa a checklist pra avançar de Em Diagnóstico.</p>
      )}
      {checklist.map((item) => (
        <label key={item.item_chave} className="flex items-center gap-2 py-1.5 text-sm text-foreground">
          <input type="checkbox" checked={item.concluido} disabled={item.concluido} onChange={() => handleToggle(item)} />
          {item.label}
          {item.concluido && (
            <span className="ml-auto text-xs text-muted-foreground">
              {item.concluido_por}, {item.concluido_at ? new Date(item.concluido_at).toLocaleDateString('pt-PT') : '—'}
            </span>
          )}
        </label>
      ))}
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
