# CRM ticket-detail.tsx — Fluxo Técnico Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `rui-tech-helper-crm/src/routes/ticket-detail.tsx` with a sequential stepper, issues management, diagnostic checklist with lock, and a tracking-link block — backed by two new backend gates and a serialization fix.

**Architecture:** Backend (`rui-tech-helper-api`): extend `TicketController::serializeTicketDetail()` to expose `tracking_token`, `issues`, `checklist` (currently missing from the admin/tecnico response — only the client-facing serializer had them); add two conditional validations inside `updateEstado()`. Frontend (`rui-tech-helper-crm`): new `Stepper`, `IssuesSection`, `ChecklistSection`, `TrackingLinkBlock` components composed into a rewritten `ticket-detail.tsx`, following the existing `apiFetch` + TanStack Query + toggle-to-form conventions already used by `OrcamentoForm`.

**Tech Stack:** Laravel 11 / Pest (backend), React 18 + TanStack Query/Router + Tailwind, no new dependencies.

**Repos:** `d:\Projectos\o Rui dos Computadores\assets\rui-tech-helper-api` (Tasks 1-3) and `d:\Projectos\o Rui dos Computadores\assets\rui-tech-helper-crm` (Tasks 4-9). Each repo needs its own feature branch before implementation starts — confirm with the user before creating them if not already on one.

**Spec:** `rui-tech-helper-crm/docs/superpowers/specs/2026-08-25-ticket-detail-rewrite-design.md`

---

## Task 1: Expose `tracking_token`, `issues`, `checklist` in the staff-facing ticket detail

**Why:** `serializeTicketDetail()` (used by `GET /api/{admin,tecnico}/tickets/{id}`) currently only returns `eventos`/`anexos`/`orcamentos`. The client-facing `serializeTicketDetailCliente()` was extended with `issues`/`checklist` in a prior sub-project, but the staff-facing method was never updated — the CRM has nothing to render for these sections without this fix. Staff view also needs `resolvido_por`/`concluido_por` (staff names), which the client-facing version deliberately omits (PII).

**Files:**
- Modify: `rui-tech-helper-api/app/Http/Controllers/Tickets/TicketController.php:141-194` (the `serializeTicketDetail` private method)
- Test: `rui-tech-helper-api/tests/Feature/TicketDetailStaffSerializationTest.php`

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Enums\TicketCategoria;
use App\Enums\TicketEstado;
use App\Enums\TicketOrigem;
use App\Enums\TicketPrioridade;
use App\Models\Cliente;
use App\Models\Ticket;
use App\Models\User;

function criarTicketParaSerializacaoStaff(): array
{
    $clienteUser = User::factory()->create(['role' => 'cliente']);
    $cliente = Cliente::create([
        'user_id' => $clienteUser->id,
        'nome' => 'Cliente Staff Serialization',
        'email' => $clienteUser->email,
        'telefone' => '912345678',
    ]);
    $tecnico = User::factory()->create(['role' => 'tecnico', 'name' => 'Joao Tecnico']);

    $ticket = Ticket::create([
        'cliente_id' => $cliente->id,
        'tecnico_id' => $tecnico->id,
        'categoria' => TicketCategoria::Hardware,
        'prioridade' => TicketPrioridade::Normal,
        'estado' => TicketEstado::EmAnalise,
        'origem' => TicketOrigem::Admin,
        'titulo' => 'PC nao liga',
        'descricao' => 'Nao arranca.',
    ]);

    return [$ticket, $tecnico];
}

test('resposta admin inclui tracking_token', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    [$ticket] = criarTicketParaSerializacaoStaff();

    $response = $this->actingAs($admin)->getJson("/api/admin/tickets/{$ticket->id}");

    $response->assertOk();
    $response->assertJsonPath('ticket.tracking_token', $ticket->tracking_token);
});

test('resposta admin inclui issues com nome de quem resolveu', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    [$ticket, $tecnico] = criarTicketParaSerializacaoStaff();

    $issue = $ticket->issues()->create(['descricao' => 'Ventoinha ruidosa']);
    $issue->update([
        'resultado' => 'resolvido',
        'resolvido_por_user_id' => $tecnico->id,
        'resolvido_at' => now(),
    ]);

    $response = $this->actingAs($admin)->getJson("/api/admin/tickets/{$ticket->id}");

    $response->assertOk();
    $response->assertJsonPath('ticket.issues.0.descricao', 'Ventoinha ruidosa');
    $response->assertJsonPath('ticket.issues.0.resultado', 'resolvido');
    $response->assertJsonPath('ticket.issues.0.resolvido_por', 'Joao Tecnico');
});

test('resposta admin inclui checklist completa da categoria com nome de quem concluiu', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    [$ticket, $tecnico] = criarTicketParaSerializacaoStaff();

    $ticket->checklistRespostas()->create([
        'item_chave' => 'testar-fonte-alimentacao',
        'concluido' => true,
        'concluido_por_user_id' => $tecnico->id,
        'concluido_at' => now(),
    ]);

    $response = $this->actingAs($admin)->getJson("/api/admin/tickets/{$ticket->id}");

    $response->assertOk();
    $response->assertJsonCount(4, 'ticket.checklist');
    $response->assertJsonPath('ticket.checklist.0.item_chave', 'testar-fonte-alimentacao');
    $response->assertJsonPath('ticket.checklist.0.concluido', true);
    $response->assertJsonPath('ticket.checklist.0.concluido_por', 'Joao Tecnico');
    $response->assertJsonPath('ticket.checklist.1.concluido', false);
    $response->assertJsonPath('ticket.checklist.1.concluido_por', null);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `php artisan test --filter=TicketDetailStaffSerializationTest`
Expected: FAIL — `tracking_token`/`issues`/`checklist` keys missing from response.

- [ ] **Step 3: Extend `serializeTicketDetail()`**

In `app/Http/Controllers/Tickets/TicketController.php`, replace the method body:

```php
    private function serializeTicketDetail(Ticket $ticket): array
    {
        $ticket->load([
            'cliente',
            'tecnico',
            'orcamentos.itens',
            'orcamentos.pagamento',
            'issues.resolvidoPor',
            'checklistRespostas.concluidoPor',
        ]);

        $itensCategoria = config('checklists')[$ticket->categoria->value] ?? [];
        $respostas = $ticket->checklistRespostas->keyBy('item_chave');
        $checklist = collect($itensCategoria)->map(function ($label, $itemChave) use ($respostas) {
            $resposta = $respostas->get($itemChave);

            return [
                'item_chave' => $itemChave,
                'label' => $label,
                'concluido' => $resposta?->concluido ?? false,
                'concluido_por' => $resposta?->concluidoPor?->name,
                'concluido_at' => $resposta?->concluido_at,
            ];
        })->values();

        return [
            'id' => $ticket->id,
            'titulo' => $ticket->titulo,
            'descricao' => $ticket->descricao,
            'estado' => $ticket->estado->value,
            'categoria' => $ticket->categoria->value,
            'prioridade' => $ticket->prioridade->value,
            'created_at' => $ticket->created_at,
            'tracking_token' => $ticket->tracking_token,
            'cliente' => [
                'id' => $ticket->cliente->id,
                'nome' => $ticket->cliente->nome,
                'email' => $ticket->cliente->email,
                'telefone' => $ticket->cliente->telefone,
            ],
            'tecnico' => $ticket->tecnico ? [
                'id' => $ticket->tecnico->id,
                'name' => $ticket->tecnico->name,
            ] : null,
            'eventos' => $ticket->eventos()->orderByDesc('created_at')->get()->map(fn ($evento) => [
                'estado_anterior' => $evento->estado_anterior->value,
                'estado_novo' => $evento->estado_novo->value,
                'observacao' => $evento->observacao,
                'created_at' => $evento->created_at,
            ]),
            'anexos' => $ticket->anexos()->orderBy('created_at')->get()->map(fn ($anexo) => [
                'id' => $anexo->id,
                'nome_original' => $anexo->nome_original,
                'content_type' => $anexo->content_type,
                'size' => $anexo->size,
                'created_at' => $anexo->created_at,
            ]),
            'orcamentos' => $ticket->orcamentos->map(fn (\App\Models\Orcamento $orcamento) => [
                'id' => $orcamento->id,
                'versao' => $orcamento->versao,
                'estado' => $orcamento->estado->value,
                'created_at' => $orcamento->created_at,
                'decided_at' => $orcamento->decided_at,
                'itens' => $orcamento->itens->map(fn ($item) => [
                    'descricao' => $item->descricao,
                    'quantidade' => $item->quantidade,
                    'preco_unitario' => $item->preco_unitario,
                ]),
                'pagamento' => $orcamento->pagamento ? [
                    'id' => $orcamento->pagamento->id,
                    'estado' => $orcamento->pagamento->estado->value,
                    'valor' => $orcamento->pagamento->valor,
                ] : null,
            ]),
            'issues' => $ticket->issues->map(fn (\App\Models\TicketIssue $issue) => [
                'id' => $issue->id,
                'descricao' => $issue->descricao,
                'resultado' => $issue->resultado,
                'observacao' => $issue->observacao,
                'resolvido_por' => $issue->resolvidoPor?->name,
                'resolvido_at' => $issue->resolvido_at,
            ]),
            'checklist' => $checklist,
        ];
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `php artisan test --filter=TicketDetailStaffSerializationTest`
Expected: PASS (3/3)

- [ ] **Step 5: Run full suite to check no regressions**

Run: `php artisan test`
Expected: all green (165 previous + 3 new = 168)

- [ ] **Step 6: Commit**

```bash
cd "rui-tech-helper-api"
git add app/Http/Controllers/Tickets/TicketController.php tests/Feature/TicketDetailStaffSerializationTest.php
git commit -m "feat: expose tracking_token, issues, checklist in staff ticket detail"
```

---

## Task 2: Backend gate — block `em_diagnostico → aguarda_pecas` with incomplete checklist

**Files:**
- Modify: `rui-tech-helper-api/app/Http/Controllers/Tickets/TicketController.php:57-77` (`updateEstado`)
- Test: `rui-tech-helper-api/tests/Feature/TicketEstadoGateTest.php`

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Enums\TicketCategoria;
use App\Enums\TicketEstado;
use App\Enums\TicketOrigem;
use App\Enums\TicketPrioridade;
use App\Models\Cliente;
use App\Models\Ticket;
use App\Models\User;

function criarTicketEmDiagnostico(?User $tecnico = null): Ticket
{
    $clienteUser = User::factory()->create(['role' => 'cliente']);
    $cliente = Cliente::create([
        'user_id' => $clienteUser->id,
        'nome' => 'Cliente Gate Checklist',
        'email' => $clienteUser->email,
        'telefone' => '912345678',
    ]);

    return Ticket::create([
        'cliente_id' => $cliente->id,
        'tecnico_id' => $tecnico?->id,
        'categoria' => TicketCategoria::Hardware,
        'prioridade' => TicketPrioridade::Normal,
        'estado' => TicketEstado::EmAnalise,
        'origem' => TicketOrigem::Admin,
        'titulo' => 'PC nao liga',
        'descricao' => 'Nao arranca.',
    ]);
}

test('avancar de em_diagnostico para aguarda_pecas falha com checklist incompleta', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $ticket = criarTicketEmDiagnostico();

    $response = $this->actingAs($admin)->patchJson("/api/admin/tickets/{$ticket->id}/estado", [
        'estado' => 'aguarda_pecas',
    ]);

    $response->assertStatus(422);
    $response->assertJsonPath('message', 'Checklist de diagnóstico incompleta.');
    expect($ticket->fresh()->estado)->toBe(TicketEstado::EmAnalise);
});

test('avancar de em_diagnostico para aguarda_pecas funciona com checklist completa', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $ticket = criarTicketEmDiagnostico();

    foreach (array_keys(config('checklists')['hardware']) as $itemChave) {
        $ticket->checklistRespostas()->create([
            'item_chave' => $itemChave,
            'concluido' => true,
            'concluido_por_user_id' => $admin->id,
            'concluido_at' => now(),
        ]);
    }

    $response = $this->actingAs($admin)->patchJson("/api/admin/tickets/{$ticket->id}/estado", [
        'estado' => 'aguarda_pecas',
    ]);

    $response->assertStatus(200);
    $response->assertJsonPath('ticket.estado', 'aguarda_pecas');
});

test('outras transicoes nao sao bloqueadas por checklist incompleta', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $ticket = criarTicketEmDiagnostico();

    $response = $this->actingAs($admin)->patchJson("/api/admin/tickets/{$ticket->id}/estado", [
        'estado' => 'cancelado',
    ]);

    $response->assertStatus(200);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `php artisan test --filter=TicketEstadoGateTest`
Expected: FAIL — first test gets 200 instead of 422 (no gate yet).

- [ ] **Step 3: Add the gate to `updateEstado()`**

In `app/Http/Controllers/Tickets/TicketController.php`, replace the `updateEstado` method:

```php
    public function updateEstado(Request $request, Ticket $ticket)
    {
        if ($request->user()->role === UserRole::Tecnico) {
            abort_if($ticket->tecnico_id !== $request->user()->id, 403);
        }

        $data = $request->validate([
            'estado' => ['required', 'in:recebido,em_diagnostico,em_reparacao,pronto_levantamento,aguarda_pecas,reparacao_concluida,entregue,cancelado'],
            'observacao' => ['nullable', 'string'],
            'observacao_visivel_cliente' => ['boolean'],
        ]);

        $novoEstado = TicketEstado::from($data['estado']);

        if ($ticket->estado === TicketEstado::EmAnalise && $novoEstado === TicketEstado::AguardaPeca) {
            $itensCategoria = config('checklists')[$ticket->categoria->value] ?? [];
            $concluidos = $ticket->checklistRespostas()->where('concluido', true)->pluck('item_chave');
            $completa = collect(array_keys($itensCategoria))->diff($concluidos)->isEmpty();

            abort_if(! $completa, 422, 'Checklist de diagnóstico incompleta.');
        }

        $evento = $ticket->mudarEstado(
            $request->user(),
            $novoEstado,
            $data['observacao'] ?? null,
            $data['observacao_visivel_cliente'] ?? false,
        );

        return response()->json(['ticket' => $ticket->fresh(), 'evento' => $evento]);
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `php artisan test --filter=TicketEstadoGateTest`
Expected: PASS (3/3)

- [ ] **Step 5: Run full suite**

Run: `php artisan test`
Expected: all green

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/Tickets/TicketController.php tests/Feature/TicketEstadoGateTest.php
git commit -m "feat: block em_diagnostico to aguarda_pecas with incomplete checklist"
```

---

## Task 3: Backend gate — block `em_reparacao → reparacao_concluida` with pending issues

**Files:**
- Modify: `rui-tech-helper-api/app/Http/Controllers/Tickets/TicketController.php` (`updateEstado`, extend Task 2's version)
- Test: `rui-tech-helper-api/tests/Feature/TicketEstadoGateTest.php` (append)

- [ ] **Step 1: Write the failing test**

Append to `tests/Feature/TicketEstadoGateTest.php`:

```php
test('avancar de em_reparacao para reparacao_concluida falha com issue pendente', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $ticket = criarTicketEmDiagnostico();
    $ticket->update(['estado' => TicketEstado::EmCurso]);
    $ticket->issues()->create(['descricao' => 'Ventoinha ruidosa']);

    $response = $this->actingAs($admin)->patchJson("/api/admin/tickets/{$ticket->id}/estado", [
        'estado' => 'reparacao_concluida',
    ]);

    $response->assertStatus(422);
    $response->assertJsonPath('message', 'Existem issues por resolver.');
});

test('avancar de em_reparacao para reparacao_concluida funciona sem issues pendentes', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $ticket = criarTicketEmDiagnostico();
    $ticket->update(['estado' => TicketEstado::EmCurso]);
    $issue = $ticket->issues()->create(['descricao' => 'Ventoinha ruidosa']);
    $issue->update(['resultado' => 'resolvido', 'resolvido_por_user_id' => $admin->id, 'resolvido_at' => now()]);

    $response = $this->actingAs($admin)->patchJson("/api/admin/tickets/{$ticket->id}/estado", [
        'estado' => 'reparacao_concluida',
    ]);

    $response->assertStatus(200);
});

test('avancar de em_reparacao para reparacao_concluida funciona sem issues registadas', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $ticket = criarTicketEmDiagnostico();
    $ticket->update(['estado' => TicketEstado::EmCurso]);

    $response = $this->actingAs($admin)->patchJson("/api/admin/tickets/{$ticket->id}/estado", [
        'estado' => 'reparacao_concluida',
    ]);

    $response->assertStatus(200);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `php artisan test --filter=TicketEstadoGateTest`
Expected: FAIL — first new test gets 200 instead of 422.

- [ ] **Step 3: Add the second gate**

In `updateEstado()`, right after the checklist gate block added in Task 2, add:

```php
        if ($ticket->estado === TicketEstado::EmCurso && $novoEstado === TicketEstado::EmTestes) {
            $pendentes = $ticket->issues()->where('resultado', 'pendente')->exists();

            abort_if($pendentes, 422, 'Existem issues por resolver.');
        }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `php artisan test --filter=TicketEstadoGateTest`
Expected: PASS (6/6)

- [ ] **Step 5: Run full suite**

Run: `php artisan test`
Expected: all green. This closes out backend work — no `finishing-a-development-branch` yet, more tasks follow in the CRM repo.

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/Tickets/TicketController.php tests/Feature/TicketEstadoGateTest.php
git commit -m "feat: block em_reparacao to reparacao_concluida with pending issues"
```

---

## Task 4: CRM — fix `ESTADOS`, extend `TicketDetail` type

**Files:**
- Modify: `rui-tech-helper-crm/src/routes/ticket-detail.tsx:1-30`

No test runner in this repo (documented project convention) — this task and the rest are verified manually via `npm run dev` at the end of Task 9.

- [ ] **Step 1: Replace the type and constant block**

At the top of `ticket-detail.tsx`, replace the `TicketDetail` type and `ESTADOS` constant:

```tsx
type TicketIssue = {
  id: number;
  descricao: string;
  resultado: 'pendente' | 'resolvido' | 'nao_resolvido';
  observacao: string | null;
  resolvido_por: string | null;
  resolvido_at: string | null;
};

type ChecklistItem = {
  item_chave: string;
  label: string;
  concluido: boolean;
  concluido_por: string | null;
  concluido_at: string | null;
};

type TicketDetail = {
  id: number;
  titulo: string;
  descricao: string;
  estado: string;
  categoria: string;
  prioridade: string;
  tracking_token: string;
  cliente: { id: number; nome: string; email: string; telefone: string };
  tecnico: { id: number; name: string } | null;
  eventos: { estado_anterior: string; estado_novo: string; observacao: string | null; created_at: string }[];
  anexos: { id: number; nome_original: string; content_type: string; size: number }[];
  orcamentos: { id: number; versao: number; estado: string; itens: { descricao: string; quantidade: number; preco_unitario: number }[] }[];
  issues: TicketIssue[];
  checklist: ChecklistItem[];
};

type Tecnico = { id: number; name: string };

const ESTADOS_SEQUENCIA = [
  { value: 'recebido', label: 'Recebido' },
  { value: 'em_diagnostico', label: 'Em Diagnóstico' },
  { value: 'aguarda_pecas', label: 'Aguarda Peças' },
  { value: 'em_reparacao', label: 'Em Reparação' },
  { value: 'reparacao_concluida', label: 'Reparação Concluída' },
  { value: 'pronto_levantamento', label: 'Pronto p/ Levantamento' },
  { value: 'entregue', label: 'Entregue' },
] as const;
```

- [ ] **Step 2: Remove the old `ESTADOS` array**

Delete the old line: `const ESTADOS = ['aberto', 'em_analise', 'em_curso', 'aguarda_cliente', 'aguarda_peca', 'em_testes', 'resolvido', 'cancelado'];` — it's replaced by `ESTADOS_SEQUENCIA` above.

- [ ] **Step 3: Commit**

```bash
cd "rui-tech-helper-crm"
git add src/routes/ticket-detail.tsx
git commit -m "refactor: align TicketDetail type and estado sequence with backend enum"
```

---

## Task 5: CRM — `Stepper` component

**Files:**
- Create: `rui-tech-helper-crm/src/components/Stepper.tsx`

- [ ] **Step 1: Write the component**

```tsx
type StepperStep = { value: string; label: string };

export function Stepper({
  steps,
  current,
  onAdvance,
  advancing,
}: {
  steps: readonly StepperStep[];
  current: string;
  onAdvance: (nextValue: string) => void;
  advancing: boolean;
}) {
  const currentIndex = steps.findIndex((s) => s.value === current);
  const nextStep = currentIndex >= 0 && currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;

  return (
    <div>
      <div className="flex items-center gap-1 overflow-x-auto py-2">
        {steps.map((step, index) => (
          <div key={step.value} className="flex items-center">
            <div className="flex min-w-[90px] flex-col items-center">
              <div
                className={
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ' +
                  (index < currentIndex
                    ? 'bg-emerald-500 text-white'
                    : index === currentIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground')
                }
              >
                {index < currentIndex ? '✓' : index + 1}
              </div>
              <span
                className={
                  'mt-1 text-center text-[11px] ' + (index === currentIndex ? 'font-semibold text-foreground' : 'text-muted-foreground')
                }
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={'mx-1 h-0.5 w-8 ' + (index < currentIndex ? 'bg-emerald-500' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>
      {nextStep && (
        <button
          onClick={() => onAdvance(nextStep.value)}
          disabled={advancing}
          className="mt-2 cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {advancing ? 'A avançar...' : `Avançar → ${nextStep.label}`}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Stepper.tsx
git commit -m "feat: add Stepper component for sequential ticket estado"
```

---

## Task 6: CRM — `IssuesSection` component

**Files:**
- Create: `rui-tech-helper-crm/src/components/IssuesSection.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { useState } from 'react';
import { apiFetch } from '@/lib/apiClient';

type TicketIssue = {
  id: number;
  descricao: string;
  resultado: 'pendente' | 'resolvido' | 'nao_resolvido';
  observacao: string | null;
  resolvido_por: string | null;
  resolvido_at: string | null;
};

const BADGE_CLASS: Record<TicketIssue['resultado'], string> = {
  pendente: 'bg-amber-500 text-black',
  resolvido: 'bg-emerald-500 text-white',
  nao_resolvido: 'bg-destructive text-white',
};

const BADGE_LABEL: Record<TicketIssue['resultado'], string> = {
  pendente: 'PENDENTE',
  resolvido: 'RESOLVIDO',
  nao_resolvido: 'NÃO RESOLVIDO',
};

export function IssuesSection({
  basePath,
  ticketId,
  issues,
  onChanged,
}: {
  basePath: string;
  ticketId: number;
  issues: TicketIssue[];
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!descricao.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch(`${basePath}/tickets/${ticketId}/issues`, { method: 'POST', body: { descricao } });
      setDescricao('');
      setShowForm(false);
      onChanged();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolver(issue: TicketIssue, resultado: 'resolvido' | 'nao_resolvido') {
    await apiFetch(`${basePath}/tickets/${ticketId}/issues/${issue.id}`, { method: 'PATCH', body: { resultado } });
    onChanged();
  }

  return (
    <div>
      {issues.map((issue) => (
        <div key={issue.id} className="mb-2 flex items-center justify-between rounded-md bg-background p-3 last:mb-0">
          <div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${BADGE_CLASS[issue.resultado]}`}>
              {BADGE_LABEL[issue.resultado]}
            </span>
            <p className="mt-1.5 text-sm text-foreground">{issue.descricao}</p>
            {issue.resolvido_por && (
              <p className="mt-0.5 text-xs text-muted-foreground">por {issue.resolvido_por}, {issue.resolvido_at}</p>
            )}
          </div>
          {issue.resultado === 'pendente' && (
            <div className="flex gap-1.5">
              <button
                onClick={() => handleResolver(issue, 'resolvido')}
                className="cursor-pointer rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white hover:opacity-90"
              >
                Resolvido
              </button>
              <button
                onClick={() => handleResolver(issue, 'nao_resolvido')}
                className="cursor-pointer rounded-md bg-destructive px-2.5 py-1 text-xs font-medium text-white hover:opacity-90"
              >
                Não resolvido
              </button>
            </div>
          )}
        </div>
      ))}
      {issues.length === 0 && <p className="text-sm text-muted-foreground">Sem issues registadas.</p>}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mt-3 cursor-pointer text-sm font-medium text-electric-soft hover:underline"
        >
          + Adicionar issue
        </button>
      )}
      {showForm && (
        <div className="mt-3 flex gap-2">
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição do problema"
            className="flex-1 rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-electric-soft"
          />
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="cursor-pointer rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            Adicionar
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/IssuesSection.tsx
git commit -m "feat: add IssuesSection component"
```

---

## Task 7: CRM — `ChecklistSection` component

**Files:**
- Create: `rui-tech-helper-crm/src/components/ChecklistSection.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { apiFetch, ApiError } from '@/lib/apiClient';

type ChecklistItem = {
  item_chave: string;
  label: string;
  concluido: boolean;
  concluido_por: string | null;
  concluido_at: string | null;
};

export function ChecklistSection({
  basePath,
  ticketId,
  checklist,
  showGateWarning,
  onChanged,
}: {
  basePath: string;
  ticketId: number;
  checklist: ChecklistItem[];
  showGateWarning: boolean;
  onChanged: () => void;
}) {
  async function handleToggle(item: ChecklistItem) {
    if (item.concluido) return;
    try {
      await apiFetch(`${basePath}/tickets/${ticketId}/checklist/${item.item_chave}`, { method: 'PATCH' });
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 409)) throw error;
    }
    onChanged();
  }

  return (
    <div>
      {showGateWarning && (
        <p className="mb-2 text-xs text-amber-500">⚠ Completa a checklist pra avançar de Em Diagnóstico.</p>
      )}
      {checklist.map((item) => (
        <label key={item.item_chave} className="flex items-center gap-2 py-1.5 text-sm text-foreground">
          <input type="checkbox" checked={item.concluido} disabled={item.concluido} onChange={() => handleToggle(item)} />
          {item.label}
          {item.concluido && (
            <span className="ml-auto text-xs text-muted-foreground">{item.concluido_por}, {item.concluido_at}</span>
          )}
        </label>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ChecklistSection.tsx
git commit -m "feat: add ChecklistSection component with permanent lock"
```

---

## Task 8: CRM — `TrackingLinkBlock` component

**Files:**
- Create: `rui-tech-helper-crm/src/components/TrackingLinkBlock.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { useState } from 'react';

export function TrackingLinkBlock({ trackingToken, clienteNome }: { trackingToken: string; clienteNome: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://tracking.oruidoscomputadores.pt/t/${trackingToken}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
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
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TrackingLinkBlock.tsx
git commit -m "feat: add TrackingLinkBlock component"
```

---

## Task 9: CRM — wire everything into `ticket-detail.tsx`

**Files:**
- Modify: `rui-tech-helper-crm/src/routes/ticket-detail.tsx` (full rewrite of the component body, keeping the type/constant changes from Task 4)

- [ ] **Step 1: Replace the component body**

Replace everything from `export function TicketDetailPage()` to the end of the file with:

```tsx
export function TicketDetailPage() {
  const { ticketId } = useParams({ from: '/tickets/$ticketId' });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const basePath = user?.role === 'admin' ? '/api/admin' : '/api/tecnico';
  const [showOrcamentoForm, setShowOrcamentoForm] = useState(false);
  const [estadoError, setEstadoError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const ticketQuery = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => apiFetch<{ ticket: TicketDetail }>(`${basePath}/tickets/${ticketId}`),
  });

  const tecnicosQuery = useQuery({
    queryKey: ['tecnicos'],
    queryFn: () => apiFetch<{ tecnicos: Tecnico[] }>('/api/admin/tecnicos'),
    enabled: user?.role === 'admin',
  });

  async function handleMudarEstado(novoEstado: string) {
    setEstadoError(null);
    setAdvancing(true);
    try {
      await apiFetch(`${basePath}/tickets/${ticketId}/estado`, { method: 'PATCH', body: { estado: novoEstado } });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const body = error.body as { message?: string } | undefined;
        setEstadoError(body?.message ?? 'Não foi possível avançar o estado.');
      } else {
        throw error;
      }
    } finally {
      setAdvancing(false);
    }
  }

  async function handleAtribuir(tecnicoId: number) {
    await apiFetch(`/api/admin/tickets/${ticketId}/atribuir`, { method: 'PATCH', body: { tecnico_id: tecnicoId } });
    queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
  }

  function invalidateTicket() {
    queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
  }

  if (ticketQuery.isLoading) return <p className="label-tech text-muted-foreground">A carregar...</p>;
  if (ticketQuery.error || !ticketQuery.data) return <p role="alert" className="text-sm text-destructive">Erro ao carregar ticket.</p>;

  const ticket = ticketQuery.data.ticket;
  const podeCancelar = ticket.estado !== 'entregue' && ticket.estado !== 'cancelado';

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{ticket.titulo}</h1>
      <p className="mt-2 text-foreground/80">{ticket.descricao}</p>
      <p className="mt-3 text-sm text-muted-foreground">
        Categoria: {ticket.categoria} · Prioridade: {ticket.prioridade}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">Cliente: {ticket.cliente.nome} ({ticket.cliente.email})</p>
      <p className="mt-1 text-sm text-muted-foreground">Técnico: {ticket.tecnico?.name ?? 'Não atribuído'}</p>

      <Section title="Estado">
        <Stepper steps={ESTADOS_SEQUENCIA} current={ticket.estado} onAdvance={handleMudarEstado} advancing={advancing} />
        {estadoError && <p role="alert" className="mt-2 text-sm text-destructive">{estadoError}</p>}
        {podeCancelar && (
          <button
            onClick={() => handleMudarEstado('cancelado')}
            className="mt-3 cursor-pointer rounded-md border border-destructive px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
          >
            Cancelar ticket
          </button>
        )}
      </Section>

      {user?.role === 'admin' && (
        <Section title="Atribuir técnico">
          <select onChange={(e) => e.target.value && handleAtribuir(Number(e.target.value))} defaultValue="" className={SELECT_CLASS}>
            <option value="" disabled>Selecionar técnico</option>
            {tecnicosQuery.data?.tecnicos.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Section>
      )}

      <Section title="Issues">
        <IssuesSection basePath={basePath} ticketId={ticket.id} issues={ticket.issues} onChanged={invalidateTicket} />
      </Section>

      <Section title={`Checklist diagnóstico — ${ticket.categoria}`}>
        <ChecklistSection
          basePath={basePath}
          ticketId={ticket.id}
          checklist={ticket.checklist}
          showGateWarning={ticket.estado === 'em_diagnostico'}
          onChanged={invalidateTicket}
        />
      </Section>

      <Section title="Link de tracking (cliente)">
        <TrackingLinkBlock trackingToken={ticket.tracking_token} clienteNome={ticket.cliente.nome} />
      </Section>

      <Section title="Timeline">
        <ul className="flex flex-col gap-2 text-sm text-foreground/80">
          {ticket.eventos.map((evento, i) => (
            <li key={i} className="border-b border-border pb-2 last:border-0">
              <span className="text-muted-foreground">{evento.created_at}:</span> {evento.estado_anterior} → {evento.estado_novo}
              {evento.observacao ? ` — ${evento.observacao}` : ''}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Anexos">
        <ul className="flex flex-col gap-2 text-sm text-foreground/80">
          {ticket.anexos.map((anexo) => (
            <li key={anexo.id}>{anexo.nome_original} ({anexo.content_type}, {anexo.size} bytes)</li>
          ))}
          {ticket.anexos.length === 0 && <li className="text-muted-foreground">Sem anexos.</li>}
        </ul>
      </Section>

      <Section title="Orçamentos">
        {ticket.orcamentos.map((orcamento) => (
          <div key={orcamento.id} className="mb-4 rounded-md border border-border p-4 last:mb-0">
            <p className="mb-2 text-sm font-medium text-foreground">v{orcamento.versao} — {orcamento.estado}</p>
            <ul className="text-sm text-foreground/80">
              {orcamento.itens.map((item, i) => (
                <li key={i}>{item.descricao} × {item.quantidade} @ {item.preco_unitario}€</li>
              ))}
            </ul>
          </div>
        ))}
        {!showOrcamentoForm && (
          <button
            onClick={() => setShowOrcamentoForm(true)}
            className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            + Novo orçamento
          </button>
        )}
        {showOrcamentoForm && (
          <OrcamentoForm
            basePath={basePath}
            ticketId={ticket.id}
            onCreated={() => {
              setShowOrcamentoForm(false);
              invalidateTicket();
            }}
          />
        )}
      </Section>
    </div>
  );
}
```

- [ ] **Step 2: Update imports and remove the old `SELECT_CLASS` usage for estado**

At the top of the file, replace the import block with:

```tsx
import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth';
import { OrcamentoForm } from './orcamento-form';
import { Stepper } from '@/components/Stepper';
import { IssuesSection } from '@/components/IssuesSection';
import { ChecklistSection } from '@/components/ChecklistSection';
import { TrackingLinkBlock } from '@/components/TrackingLinkBlock';
```

Keep the existing `Section` component and `SELECT_CLASS` constant as-is (still used by the técnico `<select>`).

- [ ] **Step 3: Start the dev server and verify manually**

Run: `npm run dev` (in `rui-tech-helper-crm`)

Open a ticket-detail page in the browser (login as admin or tecnico) and verify:
1. Stepper shows the current 8-estado sequence correctly, only next-step button is clickable.
2. Advancing from `em_diagnostico` with an incomplete checklist shows the inline 422 error and doesn't move the stepper.
3. Completing all checklist items for the ticket's categoria, then advancing, succeeds.
4. Creating an issue, resolving it, and advancing from `em_reparacao` with no pending issues succeeds; with a pending issue, shows the inline error.
5. Checklist checkbox becomes disabled with name+date after clicking, doesn't un-check.
6. "Cancelar ticket" button works from a mid-flow estado and disappears once `entregue`/`cancelado`.
7. Tracking link block shows the correct URL, "Copiar" copies to clipboard, "WhatsApp" opens a new tab with the pre-filled PT message.

- [ ] **Step 4: Commit**

```bash
git add src/routes/ticket-detail.tsx
git commit -m "feat: rewrite ticket-detail.tsx with stepper, issues, checklist, tracking link"
```

---

## After all tasks

Dispatch a final whole-branch code review (both repos, since this plan spans two), then use **superpowers:finishing-a-development-branch** separately in each repo.
