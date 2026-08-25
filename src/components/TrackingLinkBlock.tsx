import { useState } from 'react';

export function TrackingLinkBlock({ trackingToken, clienteNome }: { trackingToken: string; clienteNome: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = `https://tracking.oruidoscomputadores.pt/t/${trackingToken}`;

  async function handleCopy() {
    setError(null);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      setError('Não foi possível copiar o link.');
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsApp() {
    const mensagem = `Olá ${clienteNome}, aqui está o estado da sua reparação: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank');
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="min-w-[200px] flex-1 rounded-md bg-background px-3 py-2 text-xs text-electric-soft">{url}</code>
      <button
        onClick={handleCopy}
        className="cursor-pointer rounded-md bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:opacity-90"
      >
        {copied ? 'Copiado!' : 'Copiar'}
      </button>
      <button
        onClick={handleWhatsApp}
        className="cursor-pointer rounded-md bg-[#25D366] px-3 py-2 text-xs font-medium text-white hover:opacity-90"
      >
        WhatsApp
      </button>
      {error && <p role="alert" className="w-full text-xs text-destructive">{error}</p>}
    </div>
  );
}
