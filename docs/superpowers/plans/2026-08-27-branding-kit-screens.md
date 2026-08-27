# Branding Kit — CRM Screens Rollout

Scope approved: "Reskin + ecrãs novos" (AskUserQuestion, 2026-08-27).

## Reskin (existing code, tokens/layout only)
- [x] Dashboard — ESTADO_COLORS -> semantic CSS vars
- [x] Tickets Lista — estado/prioridade badges -> semantic tokens
- [x] Pagamentos Lista — estado badges -> semantic tokens
- [x] Clientes Lista (sem hex fixo, já ok)
- [x] Cliente Ficha (sem hex fixo, já ok)
- [x] Ticket Detalhe (sem hex fixo, já ok)
- [x] Login (já usa tokens/wordmark, sem hex fixo — sem alterações necessárias)
- [x] Orçamento form (sem hex fixo, já ok)
- [x] Dashboard donut fallback color -> var(--color-waiting)

## Reskin: DONE — todos os 8 ecrãs existentes alinhados aos tokens do brand kit.

## Ecrãs novos (precisam rota CRM + endpoint Laravel)
- [x] Agenda — backend (enum, migration, model, controller, rotas) + CRM (agendamentos-list.tsx, NovoAgendamentoForm, filtro mês/ano, mudar estado)
- [x] Diagnóstico — já implementado em ticket-detail.tsx via ChecklistSection, sem trabalho novo necessário
- [x] Equipamento Ficha + Equipamentos Lista — tabela `equipamentos` separada de equipamento_registos, backend CRUD + CRM (equipamentos-list.tsx, equipamento-detail.tsx, NovoEquipamentoForm)
- [x] Novo Ticket — rota /tickets/novo (ticket-novo.tsx), reaproveita NovaIntervencaoForm em página dedicada, distinta do modal actual
- [x] Peças e Stock — tabelas `pecas` + `movimentos_stock`, backend CRUD + movimentar, CRM (pecas-list.tsx, NovaPecaForm, entrada/saída, alerta stock baixo)

## Notas
- Design source: Claude Design project e193f42a-701d-4e44-8e03-d181c4211f1d
- Tokens já em src/index.css (info/success/warning/error/waiting)
- Brand PNGs em src/assets/brand/
