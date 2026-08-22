import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { RootLayout } from './routes/root';
import { LoginPage } from './routes/login';
import { TicketsListPage } from './routes/tickets-list';
import { TicketDetailPage } from './routes/ticket-detail';
import { PagamentosListPage } from './routes/pagamentos-list';

const rootRoute = createRootRoute({ component: RootLayout });

const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage });
const ticketsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/tickets', component: TicketsListPage });
const ticketDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/tickets/$ticketId', component: TicketDetailPage });
const pagamentosRoute = createRoute({ getParentRoute: () => rootRoute, path: '/pagamentos', component: PagamentosListPage });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => null });

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, ticketsRoute, ticketDetailRoute, pagamentosRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
