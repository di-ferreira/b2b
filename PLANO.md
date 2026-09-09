# Plano de Trabalho — EMSoft B2B (Pedido Web)

> Plano em fases derivado de `RELATORIO.md` (análise de 09/09/2026).
> Pontos críticos verificados no código; inclui 1 bug de cookie extra (`orcamento.ts:87`) não listado no relatório.

## Legenda de prioridade

- 🔴 **Crítico** — o app não funciona (bloqueia uso)
- 🟠 **Segurança** — risco de exploração
- 🟡 **Funcional** — comportamento errado em rotas específicas
- 🧹 **Limpeza** — dívida técnica / code smells
- 🧪 **Testes** — cobertura (infra já configurada)
- 🏗️ **Infra** — deploy / proteção

---

## Fase 1 — 🔴 Crítico: desbloquear o app

- [x] **1.1 Corrigir login (bcrypt)**
  - `src/app/auth/_components/authForm.tsx:47,51` — remover `generateHash` e enviar a senha crua
  - `src/app/actions/user.ts:28` — `compareHash(user.password, cliente.value.SENHA)`
    - Hoje: `compareHash(cliente.value.SENHA, user.password)` → `compareSync(hashArmazenado, hashNovo)`;
      como o 2º arg é um hash novo com salt aleatório, a comparação **sempre falha**.
    - `compareHash(password, hash)` = `compareSync(password, hash)` → 1º arg deve ser a senha crua, 2º o hash armazenado.
- [x] **1.2 Padronizar cookies** para `token_b2b`/`user_b2b`
  - `src/app/actions/vendedor.ts:8-9` — `token`/`user` → `token_b2b`/`user_b2b`
  - `src/app/actions/liberacoes.ts:154,190,237` — `token` → `token_b2b`
  - `src/app/actions/orcamento.ts:87` — `user` → `user_b2b` *(novo)*
- [x] **1.3 Corrigir logout** — `src/app/app/logout/page.tsx`
  - Virar **server component** (remover `'use client'`) e reabilitar `redirect('/auth')` (linha 8, comentada).
  - `removeCookie` é server action — pode ser chamado de server component; `redirect` só funciona em server component.

## Fase 2 — 🟠 Segurança

- [x] **2.1 Sanitizar SQL** (21 usos de `/ServiceSistema/SelectSQL`)
  - Parametrização real via `pPar` (backend EMSOFT já suporta — padrão existente em `GetClientesPgtoEmAberto`).
  - Funções convertidas: `GetPGTOsAtrazados`, `GetPGTOsNaoVencidos`, `GetPGTOsEmAberto` (cliente.ts), `GetCondicaoPGTO` (preVenda.ts), `GetNewPriceFromTable`, `GetProductPromotion` (produto.ts), `getVendasDashboard`, `getDataTotalVenda` (vendas.ts).
  - SQL removido da query string → POST com body JSON.
- [x] **2.2 Sanitizar paths** nas rotas de arquivo
  - `src/app/api/boletos/[banco]/[cic]/[nossoNumero]/route.ts` — validar `cic`/`nossoNumero` com `^\d+$` e folder com `^[a-z0-9]+$`.
- [x] **2.3 `list-banners`** — `src/app/api/list-banners/route.ts`
  - Retorna HTTP 200 em caso de erro → corrigido para 500.

## Fase 3 — 🟡 Correções funcionais

- [x] **3.1 `sales/[id]`** — `src/app/app/sales/[id]/page.tsx`
  - Substituído `FormEditPreSale` por página de detalhe de venda (iMovimento) com itens.
  - Nova action `GetVendaById` em `vendas.ts`.
- [x] **3.2 `products/[id]`** — `src/app/app/products/[id]/page.tsx`
  - Substituído detalhe de cliente por página de detalhe de produto (iProduto).
  - Usa action existente `GetProduct`. Link "Voltar" corrigido para `/app/products`.

## Fase 4 — 🧹 Dívida técnica / limpeza

- [x] **4.1 Duplicações**
  - `src/store/UserStore.ts` removido (idêntico a `index.ts`).
  - `LoadOrcamento` duplicado removido de `contasAPagarReceber.ts`.
  - `boletos/columns.tsx` removido (table.tsx define headers próprios).
- [x] **4.2 Código morto**
  - `src/lib/fetchClient` removido.
  - `src/middleware/ParseRoute` removido.
  - `DataTable` TanStack removido.
  - `QueryFilter.d.ts` — mantido (está em uso).
  - `@nextui-org/modal` removido de package.json.
  - `@tanstack/react-table` removido de package.json.
- [ ] **4.3 Fragmentação** — padronizar: 4 modais, 2 toasts (react-toastify + shadcn), 2 tabelas, 2 filtros
- [x] **4.4 Tipos**
  - `Contas.d.ts` — 45 `any` mantidos (requer conhecimento do backend para tipar).
  - Typo `QuantityRegiters` → `QuantityRegisters` corrigido em 10 arquivos.
- [x] **4.5 Estilo**
  - `alert()` em `ButtonBoleto` → `react-toastify`.
  - `for...in` sobre array — não encontrado.
  - Formatação de moeda inline — mantida (29 ocorrências, refactor futuro).
  - `String` (maiúscula) → `string` corrigido.
- [x] **4.6 NavBar** — adicionados links Produtos, Pré-Vendas, Vendas.

## Fase 5 — 🧪 Testes (infra já configurada: vitest + playwright)

- [x] **5.1 Login** — unit tests: password comparison (plain text), cookie setting, SENHA stripping
- [ ] **5.2 Fluxo de orçamento** — criação/edição (e2e — requer servidor rodando)

## Fase 6 — 🏗️ Infra / deploy

- [x] **6.1 Middleware real de auth** — `src/middleware.ts` redireciona `/app/*` → `/auth` sem cookie `token_b2b`
- [x] **6.2 Dockerfile** — multi-stage build para `output: 'standalone'` + `.dockerignore`

---

## Decisões registradas

| Item | Decisão |
|---|---|
| 1.3 Logout | Virar **server component** + `redirect('/auth')` |
| 2.1 SQL | Mitigar com **validação/escape + mover p/ body**; parametrização real = follow-up (backend) |

## Ordem de execução

1. `PLANO.md` (este arquivo)
2. **Fase 1** (crítico): 1.1 login → 1.2 cookies → 1.3 logout
3. Validar com `npm run lint` + `npx tsc --noEmit`
4. Fases 2–6 em sequência
