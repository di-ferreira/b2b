# Relatório de Análise do Repositório — EMSoft B2B (Pedido Web)

> Análise completa do repositório gerada em 09/09/2026.

## 1. Visão Geral

Portal B2B de orçamentos e pedidos para **auto-peças** (AutoSul/EMSoft), construído em **Next.js 14 (App Router)**. Ele é uma camada web sobre um ERP legado (API EMSOFT) — as entidades usam nomes em `SCREAMING_SNAKE_CASE` vindos do backend.

- **Idioma:** Português (BR) em todo o código, UI e commits
- **Tamanho:** ~13.950 LOC em `src/` (124 arquivos: 76 `.tsx`, 46 `.ts`)
- **Git:** branch `master`, sincronizado com `origin/master`. Últimos commits são "correção X" / "update Y" — desenvolvimento ativo e incremental
- **Sem Dockerfile/config de deploy** no repo, apesar de `output: 'standalone'`

## 2. Stack Tecnológica

| Categoria | Tecnologias |
|---|---|
| Framework | Next.js 14.2 (App Router), React 18, TypeScript 5 (strict) |
| Estado | Zustand (5 stores), SWR (só em `UserNameText`) |
| Tabelas | `@tanstack/react-table` + tabela própria `CustomDataTable` |
| UI | shadcn/ui (new-york) + Radix UI + Tailwind CSS + FontAwesome |
| Gráficos | ApexCharts + Recharts |
| PDF | `@react-pdf/renderer` |
| Carrossel | Swiper |
| Auth | bcryptjs + cookies httpOnly (sem NextAuth real, apesar das env vars) |
| HTTP | fetch nativo (`CustomFetch`) + axios (declarado, pouco usado) |
| Testes | Vitest + Playwright **configurados, mas ZERO testes escritos** |

## 3. Estrutura do Projeto

```
src/
├── app/                  # App Router
│   ├── page.tsx          # / → redirect para /app/dashboard
│   ├── auth/             # /auth (login)
│   ├── app/              # Área protegida (SessionWrapper)
│   │   ├── dashboard/ cart/ logout/
│   │   ├── customer/[id]/ products/[id]/
│   │   ├── pre-sales/ pre-sales/[id]/
│   │   └── sales/ sales/[id]/
│   ├── actions/          # 10 server actions (camada de dados)
│   └── api/              # 3 route handlers (boletos, banners, download)
├── components/           # ui/ (shadcn) + componentes de negócio por domínio
├── store/                # 5 stores Zustand (2 duplicadas)
├── services/api.ts       # CustomFetch (cliente HTTP)
├── lib/                  # utils, fetchClient (morto), queryFilter (OData)
├── hooks/                # Modal, useModal
├── middleware/           # ParseRoute (morto)
└── @types/               # 16 definições de tipos (domínio)
```

## 4. Arquitetura / Fluxo de Dados

```
Browser (React)
   │  Server Actions ('use server')  ← lê cookies token_b2b/user_b2b/CIC
   ▼
src/app/actions/*.ts  ── CustomFetch<T>() ──►  API EMSOFT (env EMSOFT_API)
   │                                              /Clientes /Orcamento /Movimento
   │                                              /Produto /Liberacoes /Colaboradores
   │                                              /ServiceSistema/SelectSQL  ← SQL bruto
   └──────────────────────────────────────────────► SQL Server

Separado: 3 Route Handlers servem arquivos do DISCO (PDFs de boletos + banners)
```

**Dois dados-fontes distintos:** API EMSOFT (negócio) e filesystem local (`PDFS_DIR`, `public/banners`).

## 5. Mapa de Rotas

| Rota | Tipo | Acesso | Função |
|---|---|---|---|
| `/` | Server | Público | Redirect → `/app/dashboard` |
| `/auth` | Server | Público | Login (redirect se já autenticado) |
| `/app/dashboard` | Server | Protegido | Banner + Boletos em aberto + Pré-vendas |
| `/app/cart` | Server | Protegido | Carrinho / editor de orçamento |
| `/app/customer/[id]` | Client | Protegido | Detalhe do cliente + abas financeiras |
| `/app/products` | Server | Protegido | Lista de produtos |
| `/app/products/[id]` | Server | Protegido | ⚠️ Nome enganoso — renderiza detalhe do **cliente** |
| `/app/pre-sales` / `[id]` | Server | Protegido | Lista / edição de pré-venda |
| `/app/sales` / `[id]` | Server | Protegido | Lista de vendas / ⚠️ `[id]` renderiza form de pré-venda |
| `/app/logout` | Server | Protegido | Limpa cookies (redirect comentado) |

**Proteção:** sem middleware. Via `SessionWrapper` (checa cookie `token_b2b` server-side → `redirect('/auth')`).

## 6. Modelo de Domínio (entidades principais)

`iCliente` (grande: telefones, follow-ups, agendamentos, limite, `BLOQUEADO`, `CIC`), `iProduto` (muito grande: estoque, NCM, impostos, fabricante, similares, histórico), `iOrcamento` + `ItensOrcamento`, `iPreVenda`/`iMovimento`/`iCondicaoPgto` (parcelas `PZ01`–`PZ10`), `iVendedor`, `iConta` (pagar/receber), `iLiberacao`.

## 7. Server Actions (10 domínios)

`user` (login), `cliente`, `orcamento`, `produto`, `vendedor`, `preVenda`, `vendas`, `contasAPagarReceber`, `contas` (PDF boleto), `liberacoes`. Todas usam `CustomFetch` e passam `Authorization: bearer ${token}` manualmente.

## 8. 🔴 Problemas Críticos (bugs funcionais)

1. **Login quebrado (bcrypt mal usado).** `authForm.tsx:47` gera um hash **novo** com salt aleatório no cliente; `user.ts:28` faz `compareSync(SENHA_armazenada, hash_novo)`. Como o 1º arg é um hash (não a senha) e o salt é novo a cada vez, a comparação **sempre falha**. Correto: enviar a senha crua e comparar contra o hash armazenado.
2. **Cookie com nome errado.** `LoginUser` grava `token_b2b`/`user_b2b`/`CIC`, mas:
   - `vendedor.ts:8-9` lê `token`/`user` (não existem) → header vazio
   - `liberacoes.ts:154,190,237` lê `token` (enquanto 91/121/191 usam o nome certo)
   → `getVendedorAction` e várias funções de liberação enviam auth vazia.
3. **`sales/[id]` é copy-paste** de pré-venda (`FormEditPreSale`), não um form de venda.
4. **Logout não redireciona** — `redirect('/auth')` está comentado; usuário fica em página em branco.
5. **`products/[id]` duplica `customer/[id]`** (mesma lógica, um server/um client) e o link "Voltar" aponta para `/app/customers` (rota inexistente).

## 9. 🟠 Segurança

- **SQL bruto via HTTP (21 usos):** SQL montado com template literals e valores do cliente, enviado a `/ServiceSistema/SelectSQL` — alguns até na **query string** (`?pSQL=${sql}`), o que vaza para logs. Risco real de injeção.
- **Traversing em rotas de arquivo:** `/api/boletos/[banco]/[cic]/[nossoNumero]` monta `path.join(PDFS_DIR, ...)` com params da URL sem sanitizar (o `/api/download` usa `path.basename` — correto).
- **`.env` com segredos reais** (`NEXTAUTH_SECRET`, host da API, `VENDA_PASSWORD`) existe localmente. ✅ **Não está commitado** (`.gitignore` cobre; só `exemple.env` está no git).
- `list-banners` retorna **HTTP 200 em caso de erro** (mascara falhas).

## 10. 🟡 Dívida Técnica / Code Smells

- **Duplicações:** `store/index.ts` ≡ `store/UserStore.ts` (idênticos); `LoadOrcamento` exportado em 2 arquivos; `boletos/columns.tsx` duplica headers de `boletos/table.tsx`.
- **Código morto:** `fetchClient` (nunca importado), `ParseRoute`/middleware (não existe `middleware.ts`), `DataTable` TanStack (parece não usado), `QueryFilter.d.ts` (sistema de filtro alternativo não usado), `@nextui-org/modal` (instalado, não usado).
- **Fragmentação:** 4 sistemas de modal, 2 de toast (react-toastify + shadcn), 2 de tabela, 2 de filtro.
- **`SuperSearchProduct.tsx`** tem um literal `iProduto` vazio de ~250 linhas como default.
- **Tipos:** `Contas.d.ts` cheio de `any`; prop `QuantityRegiters` (typo) propagada em todas as tabelas.
- **Estilo:** `alert()` em `ButtonBoleto`; `for...in` sobre array; formatação de moeda inline em vez de `FormatToCurrency`; `String` (maiúscula) no lugar de `string`.
- **Nav incompleta:** NavBar tem só 4 links; Products/Pre-Sales/Sales só acessíveis por link nas tabelas ou URL direta.
- **Scripts de deploy** apontam para `/c/b2b-emsoft` (caminho Windows/Git Bash).

## 11. Pontos Fortes

- Separação clara server-action / client-component
- Padrão consistente `CustomDataTable` + `columns.tsx` por domínio
- `CustomFetch` com envelope normalizado `{status, statusText, body}`
- `.env` corretamente git-ignored; `exemple.env` como template
- TypeScript strict habilitado

## 12. Recomendações (priorizadas)

1. **Corrigir o login** (enviar senha crua; `compareSync(senha, hashArmazenado)`) — bloqueia o uso do app
2. **Padronizar cookies** para `token_b2b`/`user_b2b` em `vendedor.ts` e `liberacoes.ts`
3. **Sanitizar SQL** (parâmetros) e remover SQL de query string
4. **Sanitizar paths** nas rotas de boleto/download
5. **Corrigir `sales/[id]`** (form próprio) e o **logout** (reabilitar redirect)
6. **Eliminar duplicações** (store, `LoadOrcamento`, `boletos/columns`) e código morto
7. **Escrever testes** (infra já configurada) — ao menos para login e fluxo de orçamento
8. **Adicionar middleware** real de auth + `Dockerfile` para o deploy standalone
