# EMSoft Pedido Web (B2B)

Portal B2B da AutoSul/EMSoft para clientes de auto-peças consultarem produtos,
acompanharem a situação financeira, montarem orçamentos e gerarem pré-vendas
integradas ao ERP.

Aplicação **Next.js 14 (App Router)** com **Server Actions**, TypeScript e
Tailwind CSS, consumindo a API do ERP EMSOFT.

> Documentação funcional completa: **[DOCUMENTACAO.md](./DOCUMENTACAO.md)**
> (módulos, regras de negócio, endpoints, segurança, testes e limitações).

---

## Funcionalidades

- **Login do cliente** por CNPJ (CIC) + senha, com sessão em cookies.
- **Dashboard** com banners, boletos em aberto (download de PDF) e pedidos
  aguardando faturamento.
- **Produtos**: busca (super busca + fallback SQL), preço por tabela do cliente,
  promoções, similares, histórico e estoque por filial.
- **Carrinho/Orçamento**: inclusão, edição e remoção de itens com controle de
  estoque, múltiplo de venda e preço; exportação em PDF.
- **Pré-venda**: condições e formas de pagamento, parcelas, entrega/retirada,
  validação de bloqueios financeiros e gravação no ERP.
- **Vendas**: listagem e detalhe com itens.
- **Cliente/Financeiro**: limite, débitos vencidos e a vencer, créditos e saldo
  para compra.
- **Liberações**: solicitação e consumo de liberações de bloqueio
  (`INADIMPLENCIA`, `LIMITE`, `BLOQUEADO`).

---

## Requisitos

- Node.js 20+
- Acesso à API do ERP EMSOFT (`EMSOFT_API`)
- Acesso ao compartilhamento de PDFs de boleto (quando usar `PATH_GERARPDF` ou
  `PDFS_DIR`)

---

## Configuração

Crie o arquivo `.env` na raiz (baseado em [`exemple.env`](./exemple.env)):

```env
# API do ERP
EMSOFT_API=http://host:2001/emsoft/emauto

# Credenciais de serviço usadas no login técnico
VENDA_LOGIN=
VENDA_PASSWORD=

# Diretório raiz dos PDFs de boleto (fallback quando o ERP não informa o caminho)
PDFS_DIR=

# Marca os cookies como Secure (produção com HTTPS)
COOKIE_SECURE=false
```

| Variável | Obrigatória | Descrição |
|---|---|---|
| `EMSOFT_API` | sim | URL base da API do ERP |
| `VENDA_LOGIN` / `VENDA_PASSWORD` | sim | Usuário/senha de serviço para obter o token |
| `PDFS_DIR` | não | Fallback local para PDFs de boleto |
| `COOKIE_SECURE` | não | `true` para cookies `Secure` |
| `ANALYZE` | não | `true` gera o bundle analyzer no build |

---

## Como rodar

```bash
# instalar dependências
npm ci

# desenvolvimento (http://localhost:3000)
npm run dev

# build de produção
npm run build

# produção (porta 10018)
npm run start
```

### Produção com `output: standalone`

O projeto usa `output: 'standalone'`. Nesse modo o `next start` emite o aviso
`"next start" does not work with "output: standalone"`. O modo suportado é:

```bash
npm run build
node .next/standalone/server.js
```

Ou use a imagem Docker:

```bash
docker build -t pedido-web .
docker run -p 3000:3000 --env-file .env pedido-web
```

---

## Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (porta 3000) |
| `npm run build` | Build de produção |
| `npm run start` | Inicia em produção na porta 10018 |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:watch` | Vitest em modo watch |
| `npm run test:e2e` | Testes end-to-end (Playwright) |
| `npm run test:e2e:ui` | Playwright com UI |
| `npm run lint` | ESLint |
| `npm run format` | Formatação com dprint |
| `npm run analyze` | Build com análise de bundle |

---

## Estrutura

```
src/
├── app/
│   ├── actions/        # Server Actions (integração com o ERP)
│   ├── api/            # Route Handlers (boletos, downloads, banners)
│   ├── app/            # Área autenticada (dashboard, produtos, carrinho, ...)
│   └── auth/           # Login
├── components/         # Componentes por domínio
├── hooks/              # Modal / useModal
├── lib/                # Utilitários, estoque, bloqueios, filtros OData
├── services/api.ts     # CustomFetch (wrapper de fetch)
├── store/              # Zustand (orçamento, produto, modal, usuário)
└── @types/             # Tipagens dos contratos do ERP
```

### Rotas principais

| Rota | Tela |
|---|---|
| `/auth` | Login |
| `/app/dashboard` | Banners, boletos e pré-vendas aguardando faturamento |
| `/app/customer/[id]` | Ficha do cliente + financeiro |
| `/app/products` | Busca de produtos |
| `/app/products/[id]` | Detalhe do produto + estoque por filial |
| `/app/cart` | Carrinho/orçamento |
| `/app/pre-sales` | Pré-vendas |
| `/app/pre-sales/[id]/view` | Detalhe da pré-venda |
| `/app/sales` | Vendas |
| `/app/sales/[id]` | Detalhe da venda |
| `/api/boletos/[banco]/[cic]/[nossoNumero]` | Download do PDF do boleto |
| `/api/list-banners` | Lista de banners |

---

## Testes

```bash
npm run test        # Vitest (unitários)
npm run test:e2e    # Playwright (requer servidor rodando)
```

Cobertura atual: login, pré-venda (insert + PATCH `ID_TIPO_VENDA`), regras de
estoque/preço, super busca com fallback SQL e utilitários.

---

## Regras de negócio em destaque

- Estoque disponível = `QTDATUAL - QTD_GARANTIA`.
- Quantidade ajustada ao múltiplo (`QTD_VENDA`/`MULTIPLO_COMPRA`) e limitada ao
  disponível.
- Preço: promoção → tabela do cliente → preço cadastrado.
- Bloqueios de cliente: `INADIMPLENCIA`, `LIMITE` e `BLOQUEADO`, com fluxo de
  liberação no ERP.
- Pré-venda sempre gravada como B2B (`ID_TIPO_VENDA = 1`, via PATCH após o
  insert).
- Boleto lido de `BancoBoleto.PATH_GERARPDF`
  (`Boleto_<CIC>_<DOC>_<NOSSO_NUMERO>.pdf`), com fallback para `PDFS_DIR`.

---

## Observações

- Em produção no Windows, o Next precisa de acesso ao compartilhamento UNC
  informado em `PATH_GERARPDF` para servir os PDFs.
- Alguns componentes legados apontam para rotas inexistentes
  (`/app/customers`, `/app/budgets`). Detalhes na seção 12 de
  [DOCUMENTACAO.md](./DOCUMENTACAO.md).
