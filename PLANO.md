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

- [ ] **3.1 `sales/[id]`** — `src/app/app/sales/[id]/page.tsx`
  - Hoje renderiza `FormEditPreSale` (copy-paste). Criar form de **venda** próprio.
- [ ] **3.2 `products/[id]`** — `src/app/app/products/[id]/page.tsx`
  - Nome enganoso: renderiza detalhe do **cliente**. Desduplicar de `customer/[id]` e corrigir link "Voltar" (aponta para `/app/customers`, inexistente).

## Fase 4 — 🧹 Dívida técnica / limpeza

- [ ] **4.1 Duplicações**
  - `src/store/index.ts` ≡ `src/store/UserStore.ts` (idênticos) — manter um.
  - `LoadOrcamento` exportado em 2 arquivos.
  - `boletos/columns.tsx` duplica headers de `boletos/table.tsx`.
- [ ] **4.2 Código morto**
  - `src/lib/fetchClient` (nunca importado)
  - `src/middleware/ParseRoute` (não existe `middleware.ts`)
  - `DataTable` TanStack (parece não usado)
  - `QueryFilter.d.ts` (sistema de filtro alternativo não usado)
  - `@nextui-org/modal` (instalado, não usado)
- [ ] **4.3 Fragmentação** — padronizar: 4 modais, 2 toasts (react-toastify + shadcn), 2 tabelas, 2 filtros
- [ ] **4.4 Tipos**
  - `Contas.d.ts` cheio de `any`
  - Typo `QuantityRegiters` propagado em todas as tabelas
- [ ] **4.5 Estilo**
  - `alert()` em `ButtonBoleto` → toast
  - `for...in` sobre array → `for...of`
  - Formatação de moeda inline → `FormatToCurrency`
  - `String` (maiúscula) → `string`
- [ ] **4.6 NavBar** — adicionar links Products/Pre-Sales/Sales (hoje só 4 links)

## Fase 5 — 🧪 Testes (infra já configurada: vitest + playwright)

- [ ] **5.1 Login** — unit (`compareHash`) + integração (fluxo de autenticação)
- [ ] **5.2 Fluxo de orçamento** — criação/edição

## Fase 6 — 🏗️ Infra / deploy

- [ ] **6.1 Middleware real de auth** (hoje só `SessionWrapper` checando cookie server-side)
- [ ] **6.2 Dockerfile** para o `output: 'standalone'` (scripts de deploy apontam para `/c/b2b-emsoft` — caminho Windows)

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
