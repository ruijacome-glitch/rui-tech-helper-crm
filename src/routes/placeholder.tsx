export function PlaceholderPage({ titulo }: { titulo: string }) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">{titulo}</h1>
      <div className="panel-tech flex flex-col items-center gap-2 px-6 py-16 text-center">
        <svg viewBox="0 0 24 24" className="size-10 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <p className="text-sm text-muted-foreground">Módulo em breve.</p>
      </div>
    </div>
  );
}
