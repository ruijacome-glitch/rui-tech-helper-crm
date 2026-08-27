import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { RootLayout } from './routes/root';
import { LoginPage } from './routes/login';
import { DashboardPage } from './routes/dashboard';
import { ClientesListPage } from './routes/clientes-list';
import { ClienteDetailPage } from './routes/cliente-detail';
import { TicketsListPage } from './routes/tickets-list';
import { TicketDetailPage } from './routes/ticket-detail';
import { TicketNovoPage } from './routes/ticket-novo';
import { PagamentosListPage } from './routes/pagamentos-list';
import { AgendamentosListPage } from './routes/agendamentos-list';
import { EquipamentosListPage } from './routes/equipamentos-list';
import { EquipamentoDetailPage } from './routes/equipamento-detail';
import { PecasListPage } from './routes/pecas-list';
import { PlaceholderPage } from './routes/placeholder';

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: DashboardPage });
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage });
const clientesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/clientes', component: ClientesListPage });
const clienteDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/clientes/$clienteId', component: ClienteDetailPage });
const ticketsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/tickets', component: TicketsListPage });
const ticketDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/tickets/$ticketId', component: TicketDetailPage });
const ticketNovoRoute = createRoute({ getParentRoute: () => rootRoute, path: '/tickets/novo', component: TicketNovoPage });
const pagamentosRoute = createRoute({ getParentRoute: () => rootRoute, path: '/pagamentos', component: PagamentosListPage });
const agendamentosRoute = createRoute({ getParentRoute: () => rootRoute, path: '/agendamentos', component: AgendamentosListPage });
const equipamentosRoute = createRoute({ getParentRoute: () => rootRoute, path: '/equipamentos', component: EquipamentosListPage });
const equipamentoDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/equipamentos/$equipamentoId', component: EquipamentoDetailPage });
const pecasRoute = createRoute({ getParentRoute: () => rootRoute, path: '/pecas', component: PecasListPage });
const faturasRoute = createRoute({ getParentRoute: () => rootRoute, path: '/faturas', component: () => <PlaceholderPage titulo="Faturas" /> });
const orcamentosRoute = createRoute({ getParentRoute: () => rootRoute, path: '/orcamentos', component: () => <PlaceholderPage titulo="Orçamentos" /> });
const comunicacoesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/comunicacoes', component: () => <PlaceholderPage titulo="Comunicações" /> });
const documentosRoute = createRoute({ getParentRoute: () => rootRoute, path: '/documentos', component: () => <PlaceholderPage titulo="Documentos" /> });
const relatoriosRoute = createRoute({ getParentRoute: () => rootRoute, path: '/relatorios', component: () => <PlaceholderPage titulo="Relatórios" /> });
const definicoesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/definicoes', component: () => <PlaceholderPage titulo="Definições" /> });

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  clientesRoute,
  clienteDetailRoute,
  ticketsRoute,
  ticketDetailRoute,
  ticketNovoRoute,
  pagamentosRoute,
  agendamentosRoute,
  equipamentosRoute,
  equipamentoDetailRoute,
  pecasRoute,
  faturasRoute,
  orcamentosRoute,
  comunicacoesRoute,
  documentosRoute,
  relatoriosRoute,
  definicoesRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
