# EMSoft Pedido Web (B2B) — Documentação Funcional

> Documento gerado a partir da análise do código-fonte em `src/` (outubro/2026).
> Descreve o que a aplicação faz hoje, como cada módulo funciona, as regras de
> negócio implementadas, as integrações com o ERP e as limitações conhecidas.

---

## 1. Visão geral

O **Pedido Web** é o portal B2B da AutoSul/EMSoft para clientes (auto-peças)
consultarem produtos, verificarem situação financeira, montarem orçamentos e
gerarem pré-vendas que caem no ERP. É uma aplicação **Next.js 14 (App Router)**
com Server Actions, que consome a API OData/REST do ERP EMSOFT
(`EMSOFT_API`).

Principais capacidades:

- Login do cliente por **CNPJ (CIC) + senha**.
- Dashboard com banners, **boletos em aberto** (download de PDF) e
  **pedidos aguardando faturamento**.
- Catálogo de produtos com busca (super busca + fallback SQL), preço por tabela,
  promoções, histórico de vendas, similares e estoque por filial.
- Carrinho/orçamento: incluir, editar e remover itens, com controle de
  quantidade, estoque disponível e preço do cliente; exportação em PDF.
- Pré-venda: condições/forma de pagamento, parcelas, entrega/retirada,
  verificação de bloqueios financeiros e gravação no ERP.
- Consulta de vendas e detalhamento de itens.
- Ficha do cliente com resumo financeiro (limite, débitos, créditos, saldo).
- Fluxo de **liberações** (override de bloqueios) integrado ao ERP.

---

## 2. Stack e arquitetura

| Item | Tecnologia |
|---|---|
| Framework | Next.js `14.2.x` (App Router, Server Actions) |
| Linguagem | TypeScript 5 |
| UI | React 18, Tailwind CSS, shadcn/ui (Radix), FontAwesome, Swiper |
| Estado global | Zustand (`BudgetStore`, `useProductStore`, `useModalStore`, `useUser`) |
| Formatação/datas | dayjs, Intl (pt-BR) |
| Gráficos | ApexCharts, Recharts (instalados) |
| PDF | `@react-pdf/renderer` (orçamento) |
| Toasts | react-toastify (principal) + shadcn toaster |
| Testes | Vitest + Testing Library (unit), Playwright (e2e) |
| Build | `output: 'standalone'` (Docker multi-stage) |

### Organização de pastas

```
src/
├── app/
│   ├── actions/            # Server Actions ('use server') — toda a integração com o ERP
│   ├── api/                # Route Handlers (boletos, download, banners)
│   ├── app/                # Área autenticada (layout com Header + NavBar)
│   ├── auth/               # Tela de login
│   └── layout.tsx          # Layout raiz (fonte, ToastContainer)
├── components/             # UI por domínio (budgets, preSale, products, sales, Dashboard...)
├── hooks/                  # Modal genérico, useModal
├── lib/                    # utilidades, regras de estoque e bloqueio, filtros OData
├── services/api.ts         # CustomFetch (wrapper de fetch com status + body)
├── store/                  # Zustand
└── @types/                 # Tipagens dos contratos do ERP
```

### Camada de integração

- `src/services/api.ts` — `CustomFetch<T>(path, init)` faz `fetch(EMSOFT_API + path)`,
  lê o corpo como texto e tenta `JSON.parse`. Retorna sempre
  `{ status, statusText, body }`, portanto **não lança** em HTTP 4xx/5xx.
- Todas as actions são `'use server'` e leem o token dos cookies
  (`token_b2b`) para montar `Authorization: bearer <token>`.
- O backend responde em dois formatos:
  - **OData/XData**: `{ value: [...], '@xdata.count': n }` para entity sets.
  - **Envelope de serviço**: `{ StatusCode, StatusMessage, RecordCount, Data }`
    para `/ServiceSistema/SelectSQL` e serviços de gravação.

---

## 3. Execução, ambiente e deploy

### Scripts (`package.json`)

| Script | O que faz |
|---|---|
| `npm run dev` | Sobe o Next em `http://localhost:3000` |
| `npm run build` | Build de produção (standalone) |
| `npm run start` | `next start -p 10018` |
| `npm run test` | Vitest (unitários, execução única) |
| `npm run test:watch` | Vitest em watch |
| `npm run test:e2e` | Playwright |
| `npm run analyze` | Build com bundle analyzer |
| `npm run lint` / `format` | ESLint / dprint |

### Variáveis de ambiente

| Variável | Uso |
|---|---|
| `EMSOFT_API` | URL base da API do ERP (ex.: `http://host:2001/emsoft/emauto`) |
| `VENDA_LOGIN` / `VENDA_PASSWORD` | Credenciais de serviço usadas no login técnico (`/ServiceSistema/Login`) |
| `PDFS_DIR` | Diretório raiz de PDFs de boleto (fallback legado) |
| `COOKIE_SECURE` | `true` para marcar cookies como `secure` |
| `ANALYZE` | `true` habilita o bundle analyzer |

`exemple.env` lista `NEXTAUTH_*` e `NEXT_PORT`, mas a autenticação atual **não
usa NextAuth**.

### Deploy

- `Dockerfile` multi-stage (Node 20 Alpine) copiando `.next/standalone` e
  `.next/static`; executa `node server.js` na porta 3000.
- Scripts operacionais (Windows/Git Bash): `AtualizarPedidoWeb.sh` (git pull +
  build), `iniciaServer.sh` (`npm run start`), `InitAll.sh` (atualiza + inicia).
- **Atenção:** com `output: 'standalone'`, `next start` emite o aviso
  `"next start" does not work with "output: standalone"`. O modo correto em
  produção é `node .next/standalone/server.js` (ou usar o container).
- `next.config.mjs` aplica cabeçalhos de segurança globais (HSTS,
  `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`) e limite
  de 10 MB para Server Actions.

---

## 4. Autenticação e sessão

### Fluxo de login (`src/app/actions/user.ts`)

1. O formulário (`src/app/auth/_components/authForm.tsx`) envia **CNPJ** e senha.
2. `LoginUser`:
   1. Faz login técnico em `POST /ServiceSistema/Login` com
      `VENDA_LOGIN`/`VENDA_PASSWORD` → recebe `{ value: token }`.
   2. Busca o cliente em `/Clientes?$filter=CIC eq '<cnpj>' or CIC eq '<só dígitos>'`.
   3. Compara a senha digitada com `CLIENTE.SENHA` (texto puro no ERP).
3. Em caso de sucesso grava os cookies (validade de 120 minutos):
   - `token_b2b` — token do ERP
   - `user_b2b` — código do cliente (usado em todos os filtros)
   - `CIC` — CNPJ do cliente
4. Redireciona para `/app/dashboard`.

### Proteção de rotas

- `src/middleware.ts` intercepta `/app/:path*`:
  - sem cookie `token_b2b` em `GET/HEAD` → redireciona para `/auth`;
  - requisições não-GET (Server Actions) seguem adiante para evitar erro de
    replay de streaming; a action falha com 401 e a UI mostra o erro.
- `SessionWrapper` (layout de `/app`) valida o token no servidor e redireciona
  para `/auth` se ausente.
- A tela `/auth` redireciona para o dashboard se já houver token.
- Logout: `NavBar` remove os cookies via Server Action e navega para `/auth`;
  também existe `/app/logout` (Route Handler) que apaga os cookies e redireciona.

### Observações de segurança

- A senha do cliente é comparada em texto puro (não há hash no ERP).
- `bcryptjs` e helpers `generateHash`/`compareHash` continuam em
  `src/lib/utils.ts`, mas **não são usados** no login atual.
- O token do ERP fica em cookie `httpOnly`.

---

## 5. Mapa de navegação

Layout autenticado: `Header` (logo, nome do cliente, botão sair) + `NavBar`
colapsável com os itens abaixo.

| Rota | Página | Situação |
|---|---|---|
| `/` | Redireciona para `/app/dashboard` | ativa |
| `/auth` | Login (CNPJ + senha) | ativa |
| `/app/dashboard` | Banners + boletos + pedidos aguardando faturamento | ativa |
| `/app/customer/[id]` | Ficha do cliente + financeiro + gerar orçamento | ativa |
| `/app/products` | Lista/busca de produtos | ativa |
| `/app/products/[id]` | Detalhe do produto + estoque por filial | ativa |
| `/app/cart` | Carrinho/orçamento atual (itens, edição, PDF) | ativa |
| `/app/pre-sales` | Lista de pré-vendas | ativa |
| `/app/pre-sales/[id]` | Formulário de geração de pré-venda (usa o orçamento do store) | ativa (sem link direto na lista) |
| `/app/pre-sales/[id]/view` | Detalhe somente leitura da pré-venda | ativa |
| `/app/sales` | Lista de vendas | ativa |
| `/app/sales/[id]` | Detalhe da venda com itens | ativa (sem link na lista) |
| `/app/logout` | Route Handler que limpa cookies e redireciona | ativa |
| `/app/customers`, `/app/budgets` | Referenciadas por componentes legados, **sem página correspondente** | inexistentes |

---

## 6. Funcionalidades em detalhe

### 6.1 Dashboard (`/app/dashboard`)

Três blocos:

1. **Carrossel de banners**
   - `BannerCarousel` (Swiper, autoplay 4 s, loop, navegação e paginação).
   - As imagens vêm de `GET /api/list-banners`, que lista os arquivos de
     `public/banners` com extensões `jpg/jpeg/png/gif/webp` (HTTP 500 em erro).
   - As imagens são servidas por `/banners/<arquivo>`.

2. **Boletos em aberto** (`components/Dashboard/boletos`)
   - Action: `GetContasDashboard()` em `contasAPagarReceber.ts`.
   - Filtro OData: `CLIENTE eq <código>`, `TIPO eq 'BOLETO'`,
     `CANCELADO eq 'N'`, `CONTA eq 'R'`, `RESTA ge 1`,
     `EMISSAO_BOLETO ne null` e `VENCIMENTO lt <hoje+15 dias>`;
     `$expand=CLIENTE`, `$orderby=VENCIMENTO desc`, `$top=20`.
   - Colunas: `DATA`, `DOC`, `TOTAL` e botão **BOLETO** (download do PDF).
   - Não pagina: é um resumo dos boletos que vencem nos próximos 15 dias.

3. **Pedidos aguardando faturamento** (`components/Dashboard/pre-sale`)
   - Action: `GetMovimentosDashboard()` em `preVenda.ts`.
   - Consulta `/MovimentoEventos` filtrando
     `MOVIMENTO/CLIENTE eq <código> and MOVIMENTO/TIPOMOV eq 'PRE-VENDA'
     and MOVIMENTO/CANCELADO eq 'N'`, `$expand=MOVIMENTO`,
     `$orderby=MOVIMENTO/MOVIMENTO desc`, `$top=10`.
   - Colunas: `DATA`, `DOC`, `TOTAL`, `STATUS`.

### 6.2 Download de boleto (PDF)

**Front-end** — `components/Dashboard/boletos/ButtonBoleto.tsx`:

1. Normaliza o banco de `EMISSAO_BOLETO` (ex.: `CAIXA ECONOMICA` → `caixa`,
   demais viram minúsculas sem espaços).
2. Lê `CLIENTE.CIC` (somente dígitos), `NOSSO_NUMERO` e `Doc` (campo PascalCase
   devolvido pelo XData).
3. Chama `GET /api/boletos/<banco>/<cic>/<nossoNumero>?doc=<doc>`.
4. Em sucesso, cria um Blob e força o download como
   `Boleto_<cic>_<nossoNumero>.pdf`.

**Back-end** — `src/app/api/boletos/[banco]/[cic]/[nossoNumero]/route.ts`:

1. Valida `cic` e `nossoNumero` como apenas dígitos (`400` se inválido).
2. Busca os bancos de boleto em `GET /BancoBoleto` (action
   `GetBancosBoleto`, com cache em memória de 60 s) e casa o parâmetro
   `banco` com `NOME_BANCO` por normalização (sem acento, maiúsculas, só
   letras) em `findBancoBoleto`.
3. Com `PATH_GERARPDF`, tenta os nomes, nesta ordem:
   - `Boleto_<CIC>_<DOC>_<NOSSO_NUMERO>.pdf` (padrão real em produção);
   - `Boleto_<CIC>_<NOSSO_NUMERO>.pdf` (padrão legado).
4. Se nenhum existir, varre o diretório com regex
   `^Boleto_<cic>_(.*)_?<nossoNumero>\.pdf$` (tolera um segmento extra).
5. Fallback final: `PDFS_DIR/<pasta-do-banco>/Boleto_<cic>_<nossoNumero>.pdf`
   (pastas: `caixa`, `bradesco`, `bancodobrasil`, `itau`/`itau2`).
6. Responde `application/pdf` com `Content-Disposition: attachment` e
   `Cache-Control: no-store`; `404` quando o arquivo não é encontrado.

**Caminhos UNC do Windows** (`\\192.168.254.80\SYS\EMSOFT\BANCOS\BB\PDF`):

- Se o caminho começa com `\\`, ele é preservado e combinado com
  `path.win32.join` (nunca `path.posix.normalize`, que transformava o UNC em
  `/192.168...` e o Windows resolvia como `C:\192.168...`).
- Caminhos POSIX continuam normalizados com `/`.

> O arquivo precisa existir no host onde o Next roda (servidor Windows com
> acesso ao compartilhamento) ou em `PDFS_DIR` no ambiente de desenvolvimento.

### 6.3 Carrinho / Orçamento (`/app/cart`)

**Carregamento** — `src/app/app/cart/page.tsx`:

1. `LoadOrcamento()` busca o orçamento mais recente do cliente com
   `PV eq 'N' or PV eq null`, expandindo `VENDEDOR` e `CLIENTE`.
2. Se a sessão estiver incompleta → erro `401` → redireciona para `/auth`.
3. Se não existir orçamento → `NewOrcamento()` cria um no ERP
   (`POST /ServiceVendas/NovoOrcamento`) e recarrega.
4. O orçamento é guardado no `BudgetStore` (Zustand).

**Tela** (`cart.tsx`): cabeçalho com número, data e total; tabela de itens;
botão voltar.

**Tabela de itens** (`components/budgets/budgetItens/DataTable`):

- Colunas: ações, código, referência, produto, valor unitário, qtd. em estoque
  (disponível = `QTDATUAL - QTD_GARANTIA`), quantidade editável e total.
- Linhas com estoque disponível `<= 0` ficam destacadas em vermelho.
- **Editar**: modal `FormEdit` recalcula quantidade pelo múltiplo e preço do
  cliente; `updateItem` exclui o item (`ExcluirItemOrcamento`) e o inclui de
  novo (`NovoItemOrcamento`) com os novos valores.
- **Remover**: `removeItem` no ERP e recarga do orçamento.
- **Adicionar**: `NewBudgetItem` abre a busca de produtos já preenchida com o
  último resultado do store; ao escolher um produto:
  - bloqueia se o estoque disponível for `<= 0` (toast detalhado com
    `QTDATUAL`, garantia e disponível);
  - resolve o preço (promoção > tabela do cliente > preço do produto);
  - calcula a quantidade pelo múltiplo e adiciona via `addItem`.
- **PDF**: `PdfButton` renderiza o orçamento em layout de impressão
  (`@react-pdf/renderer`) com visualizar/baixar.

**Actions de orçamento** (`src/app/actions/orcamento.ts`):

| Action | Endpoint | Descrição |
|---|---|---|
| `LoadOrcamento` | `GET /Orcamento` | Orçamento aberto do cliente + itens |
| `NewOrcamento` | `POST /ServiceVendas/NovoOrcamento` | Cria orçamento vazio |
| `UpdateOrcamento` | `PATCH /Orcamento(id)` | Atualiza `OBS1`, `OBS2`, `PV` |
| `RemoverOrcamento` | `DELETE /Orcamento(id)` | Remove itens e o orçamento |
| `addItem` | `POST /ServiceVendas/NovoItemOrcamento` | Inclui item |
| `updateItem` | `ExcluirItemOrcamento` + `NovoItemOrcamento` | Altera item (remove e recria) |
| `removeItem` | `POST /ServiceVendas/ExcluirItemOrcamento` | Exclui item |
| `GetOrcamento` | `GET /Orcamento(id)` | Orçamento completo |
| `GetOrcamentosFromVendedor` | `GET /Orcamento` | Lista por vendedor (sem uso na UI atual) |

### 6.4 Produtos

**Lista/busca** (`/app/products`, `components/products/DataTable`):

- Busca via `SearchProductsViaSQL` (SQL direto em `EST`, com `LIKE` em
  `PRODUTO`, `REFERENCIA`, `NOME`, `APLICACOES`), paginada (10/20/50/100).
- A action OData `GetProducts` (filtros por nome, referência, aplicações,
  código de barras etc., sempre com `ATIVO eq 'S'`) existe, mas a tela usa a
  busca SQL.
- Colunas: nome, produto, referência, código de barras, aplicações, quantidade
  atual e local.
- O campo de busca superior (`Filter`) dispara a busca por Enter ou botão.

**Super busca** (`SuperFindProducts`), usada no modal de inclusão de item:

- Chama `GET /ServiceProdutos/SuperBusca?Palavras=...&PularRegistros=...&QuantidadeRegistros=...`.
- `StatusCode 400` com HTTP 200 significa "nada encontrado"; nesse caso (na
  primeira página) cai para a busca SQL por `LIKE`, que cobre termos numéricos.
- Enriquece a página com estoque/preço da filial (`ComEstoqueDaLoja`) via
  `/EstoqueFiliais`; falha da filial **não derruba** a busca (colunas viram `-`).
- Colunas do modal: `AÇÕES | CÓDIGO | REFERÊNCIA | NOME | FABRICANTE | QTD_RJ |
  PREÇO_RJ | QTD_ES | PREÇO_ES`.
  - `QTD_RJ` = estoque disponível (`QTDATUAL - QTD_GARANTIA`) da loja RJ.
  - `QTD_ES`/`PREÇO_ES` vêm de `ESTOQUE_LOJAS` (loja `Filial`), uma requisição
    por página.

**Preço** (`src/store/useProductStore.ts`):

- `resolvePrice`: consulta em paralelo promoção (`PROMOCAO` com validade >=
  hoje) e preço da tabela do cliente (`TAB.PERCENTUAL` sobre `EST.PRECO`).
- Precedência: **promoção** → **preço da tabela** → **preço cadastrado**.
- Nunca lança: falhas usam o preço do produto como último recurso.

**Detalhe** (`/app/products/[id]`):

- `GetProduct` (`/Produto('<codigo>')` com fabricante e similares) e
  `GetEstoqueFiliais` (`/EstoqueFiliais`) em paralelo.
- Exibe dados cadastrais, preço e tabela de estoque por filial
  (`LOJA`, `ESTOQUE`, `PRECO`, `LOCAL1`, `ATUALIZACAO`).

**Outras actions de produto**: `TableFromProduct` (tabelas de venda, com
variantes MWM/demais), `GetNewPriceFromTable`, `GetProductPromotion`,
`GetSaleHistory` (`/ServiceClientes/ListaHistoricoVendas`), `GetSimilares`.

### 6.5 Pré-venda

**Lista** (`/app/pre-sales`): `GetPreVendas` (`GET /Movimento`) filtra
`CLIENTE`, `TIPOMOV eq 'PRE-VENDA'` e `CANCELADO eq 'N'`, expandindo cliente,
vendedor, itens e produto. Colunas: ações (ver detalhe), número, cliente, data,
vendedor, total. Paginação OData.

**Detalhe** (`/app/pre-sales/[id]/view`): dados gerais (data, cliente,
vendedor, total) e tabela de itens (`ViewItemsTable`).

**Geração** (`/app/pre-sales/[id]` → `components/preSale/FormEditPreSale.tsx`):

1. Usa o orçamento atual do `BudgetStore` (cliente, vendedor, total, itens).
2. Carrega **condições de pagamento** conforme total, tabela do cliente e
   `CARTEIRA` (se `N`, somente à vista) — `GetCondicaoPGTO` (SQL em `OPP`).
3. Carrega **formas de pagamento** (`GetFormasPGTO`, SQL em `CAR` com
   `CAIXA='S'`).
4. Monta as parcelas (`PZ01..PZ10`) com vencimentos e valores.
5. Permite escolher entrega/retirada (`ENTREGA`/`RETIRADA`).
6. Validações antes de gravar:
   - condição de pagamento selecionada (`ID > 0`);
   - nenhum item com estoque disponível `<= 0`;
   - nenhum item com quantidade `<= 0`;
   - **bloqueios do cliente** (`getBloqueios`): `INADIMPLENCIA`,
     `LIMITE` (considerando o total do pedido × saldo) e `BLOQUEADO`.
     Cada bloqueio é validado/registrado no fluxo de liberações; se não houver
     liberação válida, a pré-venda é abortada com toast.
7. `SavePreVenda` grava a pré-venda e, em seguida, `UpdateOrcamento` marca o
   orçamento com `PV='S'`.

**SavePreVenda** (`src/app/actions/preVenda.ts`):

1. `POST /ServiceVendas/NovaPreVenda` com o payload `iPreVenda`.
2. Lê o movimento criado em `body.Data.MOVIMENTO`.
3. Faz um segundo `PATCH /Movimento(<id>)` enviando **somente**
   `{ ID_TIPO_VENDA: 1 }` (B2B).
   - Motivo: o backend não trata `ORIGEM`/`ID_TIPO_VENDA` no insert; enviar
     `ORIGEM` causava `Data too large for variable [P1]` (coluna `VARCHAR(1)`).
4. Se o PATCH falhar, a pré-venda já criada é retornada mesmo assim (o insert é
   a operação crítica).

### 6.6 Vendas

- **Lista** (`/app/sales`): `GetVendas` filtra `TIPOMOV eq 'VENDA'`,
  `CANCELADO eq 'N'` e o cliente logado; colunas número, cliente, data,
  vendedor, total.
- **Detalhe** (`/app/sales/[id]`): `GetVendaById` (`/Movimento(id)` com cliente
  e vendedor) e tabela de itens (`PRODUTO`, `REFERÊNCIA`, `QTD`, `VALOR`,
  `TOTAL`), além de subtotal, desconto, total e observação.
- Actions auxiliares para dashboards (não usadas na UI atual):
  `getVendasDashboard` (total por cliente no mês), `getDataTotalVenda`
  (total mensal do vendedor) e `getLastVenda`.

### 6.7 Cliente e financeiro (`/app/customer/[id]`)

- Cabeçalho com código, nome e selo de categoria (`BRONZE`, `PRATA`, `OURO`,
  `FIEL`).
- Dados cadastrais em campos somente leitura: nome, e-mail, telefone,
  CPF/CNPJ mascarado, endereço, cidade/UF, CEP, tipo de cliente, tabela de
  preço, usar limite, limite, limite cheque, somente NFe, carteira, DDA,
  bloqueado e motivo.
- **Financeiro** em abas:
  - **Resumo**: limite de crédito, contas não vencidas, contas vencidas, total
    a receber, créditos e saldo para comprar.
  - **Créditos**, **Vencidos**, **Não vencidos**: tabelas com vencimento, doc,
    histórico e valor.
- **Gerar Orçamento**: valida bloqueios (`INADIMPLENCIA`, `LIMITE`,
  `BLOQUEADO`), solicita/consome liberações e leva ao carrinho.

**Actions financeiras** (`src/app/actions/cliente.ts`):

| Action | Origem | Retorno |
|---|---|---|
| `GetCliente` | `/Clientes(id)` + telefones/agendamentos/pendências | Cadastro |
| `GetClienteFromVendedor` | `/Clientes` filtrado pelo vendedor | Lista paginada |
| `GetPGTOsAtrazados` | `SelectSQL` (`CTS` + `CAR`) | Qtd e valor vencido |
| `GetPGTOsNaoVencidos` | `SelectSQL` | Qtd e valor a vencer |
| `GetPGTOsEmAberto` | `SelectSQL` | Contas em aberto (com atraso) |
| `GetClientesPgtoEmAberto` | `SelectSQL` (POST parametrizado) | Clientes com débito |
| `GetFinanceiroCliente` | Agrega as anteriores | Resumo + listas |

Regras do resumo:

- `ContasAbertas` = soma de `RESTA > 0`.
- `TotalCreditos` = soma de `RESTA < 0` (positivada).
- `SaldoCompra` = `LIMITE + créditos - contas em aberto`.
- `UsaLimite` = `CLIENTE.CARTEIRA === 'S'`.

### 6.8 Liberações (override de bloqueios)

`src/app/actions/liberacoes.ts` — entity `/Liberacoes`:

- `CreateLiberacao`, `UpdateLiberacao`, `LoadLiberacao`,
  `LoadLiberacaoCliente`, `Liberacoes`, `SolicitarLiberacao`,
  `ValidarLiberacao`, `MarcarLiberacaoComoUsada`.
- `ID_ONDE = 9999` significa **aguardando liberação do ERP**.
- `USADO = 'S'|'N'` indica se a liberação já foi consumida.
- `Liberacoes` (usada ao gerar pré-venda) decide entre criar, reaproveitar ou
  consumir a liberação existente.
- `SolicitarLiberacao` cria apenas se não houver pedido pendente ou liberação
  válida não usada.
- O nome do solicitante é gravado como `Ven:<nome do vendedor>` (máx. 10
  caracteres), e o local como `PRÉ-VENDA`.

### 6.9 Identificação do vendedor

`getVendedorAction` (`vendedor.ts`) resolve o vendedor do cliente logado:

1. Último orçamento do cliente (`/Orcamento`) com `$expand=VENDEDOR`;
2. se não houver, última venda (`/Movimento`);
3. se vier apenas o código, busca `/Colaboradores(id)`.

É usado nas liberações e na checagem de bloqueios.

---

## 7. Integrações com o ERP (mapa de endpoints)

| Endpoint | Uso |
|---|---|
| `POST /ServiceSistema/Login` | Login técnico (token) |
| `GET /Clientes` / `/Clientes(id)` | Cliente, login, ficha |
| `GET /ServiceSistema/SelectSQL` | Consultas SQL (financeiro, preço, busca, condições) |
| `GET /Orcamento`, `POST /ServiceVendas/NovoOrcamento`, `PATCH/DELETE /Orcamento(id)` | Orçamento |
| `POST /ServiceVendas/NovoItemOrcamento` | Incluir item |
| `POST /ServiceVendas/ExcluirItemOrcamento` | Excluir item |
| `POST /ServiceVendas/NovaPreVenda` | Gerar pré-venda |
| `PATCH /Movimento(id)` | Gravar `ID_TIPO_VENDA` |
| `GET /Movimento`, `/Movimento(id)` | Pré-vendas e vendas |
| `GET /MovimentoEventos` | Pedidos aguardando faturamento (dashboard) |
| `GET /ContaPagarReceber` | Contas/boletos |
| `GET /BancoBoleto` | Bancos e `PATH_GERARPDF` |
| `GET /Produto`, `/Produto('<cod>')` | Produtos |
| `GET /ServiceProdutos/SuperBusca` | Busca textual |
| `GET /EstoqueFiliais` | Estoque/preço por loja (`ESTOQUE_LOJAS`) |
| `GET /Similares` | Produtos similares |
| `GET /ServiceClientes/ListaHistoricoVendas` | Histórico de vendas do produto |
| `GET/POST/PUT /Liberacoes` | Liberações |
| `GET /Colaboradores(id)` | Vendedor |

### Particularidades do XData/ERP

- `$expand` com `$select` aninhado (`$expand=CLIENTE($select=...)`) não é
  suportado → usar `$expand` simples e `$select` só no nível principal.
- Comparações `eq` são **case-sensitive**; `lower()` funciona e é usado em
  `ESTOQUE_LOJAS` (`lower(LOJA) eq 'filial'`).
- Espaços em URLs devem ir como `%20` (não `+`).
- Não existe operador `in`: filtros em lote usam cadeia de `or`.
- A tabela real de contas é `CTS` (não existe `MOVIMENTO`; movimentos ficam em
  `MVE`).
- O insert de pré-venda devolve envelope
  `{ StatusCode, StatusMessage, RecordCount, Data: { MOVIMENTO, ... } }`.

---

## 8. Regras de negócio consolidadas

| Regra | Onde |
|---|---|
| Quantidade disponível = `QTDATUAL - QTD_GARANTIA` | `lib/product.ts`, tabelas e validações |
| Quantidade ajustada ao múltiplo (`QTD_VENDA` ou `MULTIPLO_COMPRA`) e limitada ao disponível | `calcQuantidade` |
| Preço: promoção → tabela do cliente → preço do produto | `useProductStore.resolvePrice` |
| Somente à vista quando `CLIENTE.CARTEIRA === 'N'` | `FormEditPreSale` |
| Bloqueios: `INADIMPLENCIA`, `LIMITE` (comparando total × saldo), `BLOQUEADO` | `lib/bloqueios.ts` |
| Liberação pendente no ERP = `ID_ONDE = 9999` | `liberacoes.ts` |
| Pré-venda sempre com `ID_TIPO_VENDA = 1` (B2B) via PATCH | `SavePreVenda` |
| Orçamento gerado vira pré-venda com `PV = 'S'` | `FormEditPreSale` |
| Boletos do dashboard: vencimento em até 15 dias, `RESTA >= 1`, não cancelados | `GetContasDashboard` |
| Arquivo de boleto: `Boleto_<CIC>_<DOC>_<NOSSO_NUMERO>.pdf` (legado sem `DOC`) | rota de boleto |
| Caminho de boleto vem de `BancoBoleto.PATH_GERARPDF` (fallback `PDFS_DIR`) | rota de boleto |
| Cliente só vê seus próprios dados (filtro por `CLIENTE`/`CIC` do cookie) | todas as actions |

---

## 9. Modelo de dados (tipos principais)

- `iCliente` (`@types/Cliente`): cadastro, limite, bloqueio, tabela, carteira,
  financeiro.
- `iProduto` (`@types/Produto`): preço, estoque, múltiplos, fabricante,
  aplicações, `QTD_ES`/`PRECO_ES` (derivados), similares.
- `iContas` (`@types/Contas`): contas a pagar/receber; campos usados pelo
  boleto (`EMISSAO_BOLETO`, `NOSSO_NUMERO`, `Doc`, `Data`, `TOTAL`,
  `VENCIMENTO`, `RESTA`, `CLIENTE`).
- `iBancoBoleto` (`@types/Contas`): `ID`, `NUMERO_BANCO`, `NOME_BANCO`,
  `NOME_AGENCIA`, `PATH_GERARPDF`, `ACEITE`, `ATIVO`.
- `iOrcamento` / `iItensOrcamento`: orçamento e itens.
- `iMovimento` / `iItensList` / `iPreVenda`: pré-venda, venda e itens.
- `iLiberacoes`: bloqueio, chave (cliente), código, status e uso.
- `ResponseType<T>` = `{ value?: T; error?: { code, message } }`, padrão de
  retorno das actions.

---

## 10. Segurança e robustez implementadas

- Middleware + validação de token no layout de `/app`.
- Cookies `httpOnly` e validade de 120 minutos; logout limpa os três cookies.
- Filtros sempre escopados pelo cliente/vendedor do cookie (não há parâmetro de
  cliente vindo do usuário nas listagens).
- Rotas de arquivo:
  - boleto: `cic`/`nossoNumero` apenas dígitos, `doc` sanitizado
    (`[A-Za-z0-9_-]`), `PATH_GERARPDF` vem do ERP (não do usuário);
  - download: `path.basename` para evitar path traversal.
- SQL: `assertSafeSQLValue` bloqueia aspas, `;` e caracteres de controle em
  valores interpolados; `sanitizeODataValue` remove aspas simples em filtros
  OData.
- `CustomFetch` trata corpo vazio/não-JSON sem lançar.
- Falha de estoque da filial não interrompe a busca de produtos.
- Falha do PATCH de `ID_TIPO_VENDA` não desfaz a pré-venda já criada.

---

## 11. Testes

`src/__tests__` (Vitest, 55 testes / 5 arquivos):

| Arquivo | Cobertura |
|---|---|
| `login.test.ts` | Login, comparação de senha, cookies, remoção de `SENHA` |
| `preVenda.test.ts` | Insert + PATCH de `ID_TIPO_VENDA`, envelope `Data` |
| `product.test.ts` | Regras de estoque/quantidade e preço |
| `superBusca.test.ts` | Super busca, fallback SQL e paginação |
| `utils.test.ts` | Máscaras, moeda, conversões, sanitização |

Comandos de verificação usados no projeto: `npx tsc --noEmit`,
`npx vitest run` e `npx next build`.

---

## 12. Limitações e dívidas técnicas conhecidas

1. **Links sem rota**: `/app/customers` e `/app/budgets` são referenciados por
   `components/customers/DataTable` e `components/budgets/DataTable`, mas essas
   páginas não existem no App Router. Esses componentes também não estão
   montados em nenhuma página (código legado). O botão "Voltar" da ficha do
   cliente aponta para `/app/customers` (404).
2. **Lista de vendas sem detalhe**: `/app/sales/[id]` existe, mas a tabela de
   vendas não oferece link para o detalhe.
3. **Pré-venda sem link para o formulário**: `/app/pre-sales/[id]` existe, mas a
   lista só oferece "ver detalhe" (`/view`). O formulário depende do orçamento
   no store.
4. **`next start` com standalone**: o script `start` usa `next start`, que não é
   o modo recomendado com `output: 'standalone'`.
5. **Duas implementações de download**: `src/app/api/download/[file]/route.ts`
   e `src/app/api/download/router.ts` (este último não é uma rota válida do
   App Router; parece código morto).
6. **Fragmentação de UI**: dois toasts (react-toastify e shadcn), dois estilos
   de tabela (CustomDataTable e tabelas shadcn), modais duplicados.
7. **Senha em texto puro** no cadastro do cliente (limitação do ERP, não do
   front).
8. **Boletos dependem de filesystem**: se o host do Next não tiver acesso ao
   compartilhamento (`PATH_GERARPDF`) nem a `PDFS_DIR`, o download retorna 404.
9. **Actions não utilizadas pela UI**: `GetProducts`, `TableFromProduct`,
   `GetSaleHistory`, `getVendasDashboard`, `getDataTotalVenda`, `getLastVenda`,
   `GetContasAPagarFromCliente`.
10. **Filtro legado** em `GetContasAPagarFromCliente` usa `VENDEDOR eq <CIC>`
    no caminho padrão, o que não corresponde ao restante do app (mais um motivo
    para considerá-lo legado).

---

## 13. Histórico funcional recente (commits)

| Commit | Mudança |
|---|---|
| `7f51222` | Super busca + fallback SQL + paginação |
| `7f7c48d` | Estoque por loja na busca e `GET /EstoqueFiliais` |
| `e6e1953` / `1b0e94f` | `ID_TIPO_VENDA = 1` na pré-venda (fix `'use server'`) |
| `a96e49b` / `5b02475` / `cb6b040` | Insert + PATCH da pré-venda, envelope `Data`, patch só com `ID_TIPO_VENDA` |
| `bededeb` | `QTD_RJ` passa a ser estoque disponível |
| `71042be` / `5ab384c` | Otimização do dashboard (15 dias, `$top=20`) e fix de `$expand` aninhado |
| `59042c7` / `80efbef` | Boleto via `BancoBoleto.PATH_GERARPDF` + fallback `PDFS_DIR` |
| `2029936` / `5d7b80e` / `eb031d3` | Nome real `CIC_DOC_NOSSO`, leitura de `Doc` e preservação de caminho UNC |

---

## 14. Referências rápidas

- Configuração de UI shadcn: `components.json`.
- Tailwind: `tailwind.config.ts` (paleta `emsoft_*`, breakpoints `tablet*`,
  `laptop`).
- Tipagens de tabela: `src/@types/Table.d.ts` (`iColumnType`, `iDataResultTable`).
- Filtros OData: `src/lib/queryFilter` (`sanitizeODataValue`).
- Coleções de mídia: `public/banners`, `public/LogoAutosul.png`,
  `public/LogoAutosulBraca.png`.
