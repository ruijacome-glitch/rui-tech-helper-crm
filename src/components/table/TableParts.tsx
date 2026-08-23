export function TableSkeleton({ cols }: { cols: number }) {
  return (
    <div className="panel-tech overflow-hidden">
      {Array.from({ length: 5 }).map((_, row) => (
        <div key={row} className="flex gap-6 border-b border-border px-4 py-3.5 last:border-0">
          {Array.from({ length: cols }).map((_, col) => (
            <div key={col} className="h-4 flex-1 animate-pulse rounded bg-secondary" />
          ))}
        </div>
      ))}
    </div>
  );
}

const DEFAULT_EMPTY_ICON_PATH = 'M9 13h6m-6 4h6M9 5h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z';

export function EmptyState({ message, iconPath = DEFAULT_EMPTY_ICON_PATH }: { message: string; iconPath?: string }) {
  return (
    <div className="panel-tech flex flex-col items-center gap-2 px-6 py-16 text-center">
      <svg viewBox="0 0 24 24" className="size-10 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
      </svg>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export const CIRCLE_ALERT_ICON_PATH = 'M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z';
