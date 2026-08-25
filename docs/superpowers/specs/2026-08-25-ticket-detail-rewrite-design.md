# CRM `ticket-detail.tsx` — Fluxo Técnico — Design

**Sub-projecto 8 (parte 2)** — segue o backend "Fluxo Técnico + Tracking" (`rui-tech-helper-api`, já merged/deployed). Consome os endpoints já shipados: issues, checklist, novo enum `TicketEstado`, `tracking_token`.

Sequência: 7 (Nova Intervenção, done) → 8a (Backend Fluxo Técnico + Tracking, done) → **8b (CRM ticket-detail.tsx, este spec)** → 8c (novo repo `rui-tech-helper-tracking`, deferred) → 9 (Faturação).

## Goal

Reescrever `ticket-detail.tsx` pra:
1. Substituir `<select>` de estado por stepper visual sequencial com os 8 estados novos.
2. Gerir issues (criar, marcar resolvido/não resolvido).
3. Gerir checklist de diagnóstico fixa por categoria, com lock permanente.
4. Mostrar link de tracking público (copiar + partilhar via WhatsApp).
5. Bloquear certas transições de estado até condições de qualidade estarem satisfeitas (checklist completa, issues resolvidas).

## Scope

**Dentro:**
- Rewrite de `ticket-detail.tsx` e `TicketDetail` type.
- Novos componentes: `Stepper`, `IssuesSection`, `ChecklistSection`, `TrackingLinkBlock`.
- Backend: `serializeTicketDetail()` passa a incluir `tracking_token`.
- Backend: `updateEstado()` ganha duas validações de gate (checklist e issues).
- Testes Pest novos pros dois gates.

**Fora:**
- Novo repo `rui-tech-helper-tracking` — spec própria, sub-projecto 8c.
- Faturação/pagamentos parciais — Spec 2 (sub-projecto 9).
- Edição de checklist via UI — fixo em código (já decidido no spec do backend).
- Reordenar/tornar o stepper não-sequencial — explicitamente descartado (ver decisão abaixo).

## Decisões de design

### Stepper — sequencial, não salto livre

Clique só dispara `mudarEstado` pro **próximo** estado da sequência. Estados passados mostram check verde, actual azul com número, futuros cinza disabled. Evita saltos acidentais que o `<select>` actual permitia.

`ESTADOS` (ordem fixa):
`recebido → em_diagnostico → aguarda_pecas → em_reparacao → reparacao_concluida → pronto_levantamento → entregue`

`cancelado` fica **fora** da sequência: botão vermelho "Cancelar ticket" à parte do stepper, visível em qualquer estado excepto `entregue`/`cancelado` (estados terminais). Chama `mudarEstado('cancelado')` directamente, sem confirmação extra na UI (mensagem de erro do backend cobre casos inválidos).

### Gates de qualidade — novos no backend

Duas transições do stepper passam a ser condicionais. `TicketController::updateEstado()` valida antes de aceitar a mudança:

1. **`em_diagnostico → aguarda_pecas`**: rejeita com `422` se algum item da checklist fixa da `categoria` do ticket (`config('checklists')[$ticket->categoria->value]`) ainda não tiver resposta `concluido=true` em `ticket_checklist_respostas`. Mensagem: `"Checklist de diagnóstico incompleta."`
2. **`em_reparacao → reparacao_concluida`**: rejeita com `422` se existir `TicketIssue` do ticket com `resultado='pendente'`. Mensagem: `"Existem issues por resolver."`

Todas as outras transições (incluindo `cancelado` e as restantes do stepper) seguem sem gate — mantém `Rule::enum(TicketEstado::class)` como validação única, igual a hoje.

Estes gates só se aplicam às rotas `admin`/`tecnico` `updateEstado` — não afectam a rota pública de tracking (que é read-only + decisão de orçamento, sem mudar estado).

**Porquê no controller e não em `Ticket::mudarEstado()`:** o model method já é reusado por outros fluxos (ex.: seeders, testes) que não devem ficar bloqueados por regras de UI/negócio específicas do fluxo técnico. A validação de gate é uma regra de request, não de domínio do model.

### Issues — sem restrição de estado

Criar/editar issues (`POST`/`PATCH .../issues`) continua disponível em qualquer estado do ticket — já implementado assim no backend, sem mudança necessária. UI: lista com badge de resultado (pendente=amarelo, resolvido=verde, não_resolvido=vermelho) + botões "Resolvido"/"Não resolvido" quando pendente + "+ Adicionar issue" (toggle-to-form, reutiliza o padrão de `OrcamentoForm`).

### Checklist — informativo com aviso de gate

Checkbox por item fixo da categoria. Ao marcar: confirmação inline (nome do técnico + timestamp, permanente — replica o comportamento 409 já garantido pelo backend), depois disabled com nome+data. Enquanto o ticket está em `em_diagnostico`, mostra aviso visível: "Completa a checklist pra avançar."

### Tracking link — novo bloco

Backend: `serializeTicketDetail()` (privado, em `TicketController.php:141`) ganha `'tracking_token' => $ticket->tracking_token` no array retornado — o campo já existe no model (`Ticket::booted()` gera-o), só faltava expor no admin/tecnico. `$hidden` no model não afecta isto porque o array é montado campo-a-campo, não via `toArray()`.

CRM: bloco com `https://tracking.oruidoscomputadores.pt/t/{tracking_token}` completo, botão "Copiar" (clipboard API), botão "WhatsApp" que abre `wa.me/?text=` com mensagem pré-preenchida em PT: `"Olá {cliente.nome}, aqui está o estado da sua reparação: {url}"` (URL-encoded).

## Data flow

```
Técnico avança stepper (clique no próximo estado)
  → handleMudarEstado(novoEstado) → PATCH {basePath}/tickets/{id}/estado
    → updateEstado() valida enum + gate (se aplicável)
    → 200: TicketEvento criado, invalidateQueries(['ticket', id])
    → 422 (gate falhou): CRM mostra mensagem inline, stepper não avança

Técnico marca item da checklist
  → PATCH {basePath}/tickets/{id}/checklist/{itemChave}
    → 200 primeira vez: grava concluido+user+timestamp
    → 409 se já concluido (não deve acontecer via UI — botão fica disabled após 1º sucesso)

Técnico cria/resolve issue
  → POST/PATCH {basePath}/tickets/{id}/issues[/{id}]
    → 200, invalidateQueries(['ticket', id])

Técnico copia/partilha link
  → sem chamada API — tracking_token já vem no GET inicial do ticket
```

## Error handling

- `422` no `updateEstado` por gate falhado → mensagem inline específica (checklist incompleta / issues por resolver), stepper mantém estado actual, sem toast genérico.
- `409` no checklist → não deve ocorrer via fluxo normal (botão disabled após sucesso); se ocorrer (ex.: duas abas abertas), CRM ignora silenciosamente e refetch (`invalidateQueries`) pra sincronizar UI com estado real.
- Falha de rede em qualquer mutação → mensagem de erro genérica já existente no padrão actual do projecto (sem mudança).

## Testing

- **Backend (Pest)**: `TicketUpdateEstadoChecklistGateTest` (422 com checklist incompleta, 200 quando completa), `TicketUpdateEstadoIssuesGateTest` (422 com issue pendente, 200 quando todas resolvidas/não_resolvidas), regressão confirmando `tracking_token` aparece em `showAdmin`/`showTecnico`.
- **CRM**: sem test runner configurado (consistente com resto do projecto). Verificação manual via browser: avançar stepper sequencialmente, tentar avançar de `em_diagnostico` com checklist incompleta (confirma bloqueio), completar checklist e avançar, tentar avançar de `em_reparacao` com issue pendente (confirma bloqueio), resolver issue e avançar, cancelar ticket a partir de estado intermédio, copiar link, abrir WhatsApp com mensagem pré-preenchida.

## Out of scope (explícito)

- Novo repo `rui-tech-helper-tracking` — spec/sub-projecto à parte.
- Reordenar checklist ou permitir edição de itens via UI.
- Notificação automática ao cliente quando gate é ultrapassado (fora do que o sistema de email já faz em `mudarEstado`).
- Desfazer/recuar estado no stepper (sem "voltar atrás" — consistente com o fluxo actual, que também não tem).
