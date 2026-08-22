import { Outlet, Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { LogoMark, Wordmark } from '@/components/brand/Brand';

const CONTEUDO_SITE_URL = `${import.meta.env.VITE_API_URL}/admin/conteudo`;

const NAV_LINK_CLASS =
  'block rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground';

export function RootLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== '/login') {
      navigate({ to: '/login' });
    }
  }, [loading, user, pathname, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="label-tech text-muted-foreground">A carregar...</p>
      </div>
    );
  }

  if (!user) return <Outlet />;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 flex-col justify-between border-r border-border bg-night-soft px-4 py-6">
        <div>
          <div className="mb-1 flex items-center gap-3 px-3">
            <LogoMark />
            <Wordmark />
          </div>
          <p className="label-tech mb-6 px-3 text-muted-foreground">Backoffice</p>

          <nav className="flex flex-col gap-1">
            <Link to="/tickets" className={NAV_LINK_CLASS} activeProps={{ className: `${NAV_LINK_CLASS} bg-secondary text-foreground` }}>
              Tickets
            </Link>
            {user.role === 'admin' && (
              <Link to="/pagamentos" className={NAV_LINK_CLASS} activeProps={{ className: `${NAV_LINK_CLASS} bg-secondary text-foreground` }}>
                Pagamentos
              </Link>
            )}
            {user.role === 'admin' && (
              <a href={CONTEUDO_SITE_URL} target="_blank" rel="noreferrer" className={NAV_LINK_CLASS}>
                Conteúdo site ↗
              </a>
            )}
          </nav>
        </div>

        <div className="border-t border-border pt-4">
          <p className="px-3 text-sm text-foreground">{user.name}</p>
          <p className="label-tech px-3 pb-3 text-muted-foreground">{user.role}</p>
          <button
            onClick={() => logout().then(() => navigate({ to: '/login' }))}
            className="w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
