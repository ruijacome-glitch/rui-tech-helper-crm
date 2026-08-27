import { useNavigate } from '@tanstack/react-router';
import { NovaIntervencaoForm } from '@/components/NovaIntervencaoForm';

export function TicketNovoPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nova Intervenção</h1>
      <div className="panel-tech p-6">
        <NovaIntervencaoForm onCreated={() => navigate({ to: '/tickets' })} />
      </div>
    </div>
  );
}
