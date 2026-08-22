import { Outlet, Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';

const CONTEUDO_SITE_URL = `${import.meta.env.VITE_API_URL}/admin/conteudo`;

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

  if (loading) return <p>A carregar...</p>;
  if (!user) return <Outlet />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: '220px', borderRight: '1px solid #ddd', padding: '16px' }}>
        <p>{user.name} ({user.role})</p>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><Link to="/tickets">Tickets</Link></li>
          {user.role === 'admin' && <li><Link to="/pagamentos">Pagamentos</Link></li>}
          {user.role === 'admin' && (
            <li>
              <a href={CONTEUDO_SITE_URL} target="_blank" rel="noreferrer">
                Conteúdo site ↗
              </a>
            </li>
          )}
        </ul>
        <button onClick={() => logout().then(() => navigate({ to: '/login' }))}>Sair</button>
      </nav>
      <main style={{ flex: 1, padding: '24px' }}>
        <Outlet />
      </main>
    </div>
  );
}
