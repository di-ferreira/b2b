---
name: tms-xdata
description: 'Como escrever, revisar e depurar código Delphi que usa o TMS XData — servidores REST/JSON com service operations, CRUD endpoints automáticos sobre TMS Aurelius, TXDataClient, autenticação JWT, Swagger/OpenAPI e clientes TMS Web Core. Use SEMPRE que aparecer qualquer sinal de XData no pedido ou no código: units XData.*, atributos [ServiceContract], [ServiceImplementation], [Route], [HttpGet], [Authorize], [EntityAuthorize], [URIPath], tipos TXDataServerModule, TXDataServer, TXDataClient, TXDataOperationContext, TXDataConnectionPool, TXDataWebClient, TXDataWebDataset, TJwtMiddleware — ou quando o usuário falar em criar API REST em Delphi, expor entidades Aurelius via HTTP, servidor Sparkle, backend para TMS Web Core, endpoints $filter/$orderby/$top. Use também quando o pedido parecer genérico ("criar um endpoint", "publicar essa tabela numa API", "consumir esse serviço do Delphi") mas o projeto já usar XData.'
---

# TMS XData (framework REST/JSON para Delphi)

XData é um framework Delphi (XE2+) para criar servidores HTTP/HTTPS que expõem
dados via REST/JSON. Ele tem duas formas de publicar endpoints, que convivem no
mesmo servidor:

1. **Service operations** — você declara métodos numa interface Delphi, marca com
   atributos e cada método vira um endpoint. É o mecanismo principal e não
   depende de banco de dados nem de ORM.
2. **CRUD endpoints automáticos** — se o projeto usar TMS Aurelius, cada entidade
   mapeada vira automaticamente um entity set com GET/POST/PUT/PATCH/DELETE e
   sintaxe de consulta inspirada em OData (`$filter`, `$orderby`, `$top`...).

XData roda sobre **TMS Sparkle** (camada HTTP: servidor, middlewares, request/response)
e integra opcionalmente com **TMS Aurelius** (ORM). Baseado no User Guide oficial v5.27.

## Como usar esta skill

O `SKILL.md` cobre a arquitetura, o fluxo mínimo e os erros mais comuns. Para
detalhes, leia o arquivo de referência correspondente **antes** de escrever código:

| Arquivo | Leia quando o pedido envolver |
|---|---|
| `references/server-setup.md` | criar/configurar o servidor, wizards, componentes de design-time, TXDataServerModule, pool de conexões, multi-model, CORS, middlewares |
| `references/service-operations.md` | contratos e implementações, roteamento, binding de parâmetros, tipos suportados, retorno, validação, gerenciamento de memória, TXDataOperationContext, TXDataQuery |
| `references/crud-endpoints.md` | entity sets, convenções de URL, `$filter`/`$orderby`/`$top`/`$skip`/`$expand`/`$select`/`$inlinecount`, funções, literais, permissões, POST/PUT/PATCH/DELETE, blobs |
| `references/json-format.md` | formato do JSON, `$id`/`$ref`, `@xdata.type`, `@xdata.ref`, `@xdata.proxy`, blobs, atributos Json*/XData*, converters, formato de erro, canonical id |
| `references/client-delphi.md` | TXDataClient, Get/List/Post/Put/Delete/Count, query builder, memória no cliente, autenticação, multi-model |
| `references/events-and-security.md` | eventos server-side (OnEntity*, OnModuleException, OnManagerCreate), JWT, TJwtMiddleware, atributos de autorização, autorização manual |
| `references/openapi-swagger.md` | documento OpenAPI, Swagger UI, Redoc, documentação XML, tags, propriedades required/deprecated |
| `references/webcore.md` | TMS Web Core: TXDataWebConnection, TXDataWebClient, TXDataWebDataset, async/await, CORS, wizard de aplicação web |

Não invente API. Se um método, atributo ou propriedade não estiver nesta skill,
diga que precisa confirmar na documentação em vez de chutar assinatura.

## Servidor mínimo funcional

O jeito mais rápido é o wizard (`File > New > Other > Delphi Projects > TMS XData >
TMS XData VCL Server`), que gera um projeto com componentes de design-time. Mas
é importante saber a forma em código, porque é ela que explica o que os
componentes fazem:

```delphi
uses
  Sparkle.HttpSys.Server, XData.Server.Module,
  XData.Aurelius.ConnectionPool, Aurelius.Drivers.Interfaces;

var
  Server: THttpSysServer;
begin
  Server := THttpSysServer.Create;
  Server.AddModule(TXDataServerModule.Create(
    'http://+:2001/tms/xdata',
    TDBConnectionPool.Create(25, TDBConnectionFactory.Create(
      function: IDBConnection
      var
        DM: TDBDataModule;
      begin
        DM := TDBDataModule.Create(nil);
        Result := TFireDacConnectionAdapter.Create(DM.FDConnection1, DM);
      end))
  ));
  Server.Start;
end;
```

Três peças, sempre nesta ordem lógica: uma **IDBConnectionFactory** que sabe criar
conexões, um **IDBConnectionPool** que as reaproveita entre requisições, e o
**TXDataServerModule** que é o servidor XData propriamente dito, adicionado a um
servidor Sparkle. Se o servidor não precisa de banco (só service operations sem
Aurelius), o pool é opcional — há um construtor que recebe só a BaseUrl.

> **Reserva de URL (http.sys):** o servidor baseado em http.sys exige que a URL
> esteja reservada no Windows. A instalação do Sparkle já reserva
> `http://+:2001/tms`. Se você usar outra porta ou um caminho que não comece com
> `tms`, precisa reservar a URL ou o servidor falha ao iniciar. Esse é um dos
> erros mais comuns de quem está começando.

## Service operation mínima

Duas unidades: uma com a **interface** (compartilhável com o cliente Delphi) e
outra com a **implementação** (só no servidor).

```delphi
unit MyServiceInterface;
interface
uses XData.Service.Common;

type
  [ServiceContract]
  IMyService = interface(IInvokable)
  ['{BAD477A2-86EC-45B9-A1B1-C896C58DD5E0}']   // Shift+Ctrl+G gera o GUID
    function Sum(A, B: Double): Double;
  end;

implementation
initialization
  RegisterServiceType(TypeInfo(IMyService));
end.
```

```delphi
unit MyService;
interface
uses MyServiceInterface, XData.Service.Common;

type
  [ServiceImplementation]
  TMyService = class(TInterfacedObject, IMyService)
  private
    function Sum(A, B: Double): Double;
  end;

implementation

function TMyService.Sum(A, B: Double): Double;
begin
  Result := A + B;
end;

initialization
  RegisterServiceType(TMyService);
end.
```

Isso já cria o endpoint `POST /MyService/Sum`. Nenhum registro adicional é
necessário: o módulo varre o modelo e encontra contrato e implementação pelos
atributos. Existe também o wizard `TMS XData Service` que gera esse par de units.

O cliente Delphi reusa a **mesma interface**, sem gerar proxy:

```delphi
Client := TXDataClient.Create;
Client.Uri := 'http://localhost:2001/tms/xdata';
SumResult := Client.Service<IMyService>.Sum(10, 5);
```

E qualquer cliente HTTP invoca o mesmo endpoint:

```http
POST /tms/xdata/MyService/Sum HTTP/1.1
{ "A": 10, "B": 5 }
```

## Modelo mental que evita a maioria dos erros

**O contrato define o endpoint, a implementação só executa.** Atributos como
`[Route]`, `[HttpGet]`, `[FromQuery]`, `[XDefault]` e `[Authorize]` só têm efeito
na **interface**. Colocá-los na classe de implementação não faz nada, e é uma
fonte silenciosa de confusão ("mudei para GET e continua exigindo POST").

**O contexto da operação é a porta de entrada para tudo.**
`TXDataOperationContext.Current` dá acesso ao TObjectManager já configurado
(`GetManager`), à conexão (`Connection`), ao request e ao response Sparkle.
Prefira sempre o manager do contexto a criar um `TObjectManager` próprio — é ele
que integra o gerenciamento automático de memória.

**Memória no servidor é automática; no cliente, não é.** No servidor, objetos
recebidos como parâmetro, retornados como resultado, ou gerenciados pelo manager
do contexto são destruídos pelo XData. No cliente (`TXDataClient`), objetos
passados como parâmetro e resultados do tipo `TList<T>` ou `TStream` são
responsabilidade sua. As regras completas e as exceções estão em
`references/service-operations.md` e `references/client-delphi.md` — leia antes de
escrever qualquer coisa que crie objetos, porque errar aqui gera vazamento ou
Access Violation, não erro de compilação.

**Entidades precisam ser referenciadas para não sumirem.** O linker do Delphi
remove classes não usadas. Se uma entidade Aurelius só existe para ser publicada
pelo XData, chame `RegisterEntity(TCustomer)` em algum lugar do servidor, senão o
entity set simplesmente não aparece.

**Nomes perdem o prefixo por padrão.** `TCustomer` vira entity set `Customer`,
o campo `FName` vira a propriedade `Name`, a interface `IMyService` vira o
segmento `MyService`. Dá para mudar caso a caso (`[URIPath]`, `[Route]`) ou
globalmente (`TXDataModelBuilder`).

## Erros comuns e como reconhecê-los

| Sintoma | Causa provável |
|---|---|
| Servidor não inicia, erro do http.sys | URL não reservada no Windows (ver acima) |
| Endpoint responde 404 mesmo existindo | conflito com CRUD endpoint — qualquer subpath sob `Customers/` é tratado pelo processador de CRUD; ajuste `RoutingPrecedence` para `Service` |
| "parameter is missing" chamando por HTTP puro | valor default declarado só no protótipo Delphi; falta o atributo `[XDefault(...)]` |
| Access Violation ao destruir um manager próprio | entidade retornada pertencia a um TObjectManager criado manualmente; use o manager do contexto ou `OwnsObjects := False` |
| Cliente lança "propriedade desconhecida" | classes do cliente fora de sincronia com o servidor; `IgnoreUnknownProperties := True` como paliativo |
| Aplicação Web Core não conecta | CORS (adicionar middleware ou `AccessControlAllowOrigin`) ou mistura de HTTPS/HTTP |
| Objeto associado volta como `"X@xdata.ref"` e não inline | comportamento padrão; use `$expand=X` ou aumente `DefaultExpandLevel` |
| Endpoint de service operation e entity set com mesma URL | ver `RoutingPrecedence` em `references/server-setup.md` |

## Checklist antes de entregar código XData

- Interface herda de `IInvokable`, tem GUID e `[ServiceContract]`; implementação
  herda de `TInterfacedObject` e tem `[ServiceImplementation]`.
- Ambas chamam `RegisterServiceType` na seção `initialization`.
- Atributos de roteamento/binding/autorização estão na **interface**.
- Objetos criados que não são parâmetro nem resultado foram adicionados a
  `TXDataOperationContext.Current.Handler.ManagedObjects` ou destruídos.
- Permissões dos entity sets foram definidas conscientemente
  (`SetEntitySetPermissions`) — por padrão o módulo publica tudo com permissão total.
- Endpoints sensíveis têm `[Authorize]`/`[AuthorizeScopes]` ou `[EntityAuthorize*]`,
  e há um `TJwtMiddleware` no servidor.
- Em produção: HTTPS, e nunca segredo de JWT hardcoded em código versionado.

## API EMAuto (consumo frontend B2B)

Documentação específica da API EMAuto consumida pelo app B2B Next.js.

### Endpoints

- **Base URL**: `http://emsoft02.ddns.net:2002/emsoft/emauto`
- **Swagger UI**: `http://emsoft02.ddns.net:2002/emsoft/emauto/swaggerui`
- **OpenAPI Spec**: `http://emsoft02.ddns.net:2002/emsoft/emauto/openapi/swagger.json`

### Entidades (OData)

| Endpoint | Descrição |
|----------|-----------|
| `/Clientes` | Clientes |
| `/Colaboradores` | Vendedores |
| `/Produto` | Produtos |
| `/Similares` | Produtos similares |
| `/Orcamento` | Orçamentos |
| `/OrcamentoItem` | Itens de orçamento |
| `/OrcamentoFormaPgto` | Formas de pgto de orçamento |
| `/Movimento` | Vendas/Pre-vendas |
| `/MovimentoItens` | Itens de movimento |
| `/MovimentoEventos` | Eventos de movimento |
| `/MovimentoPagamentos` | Pagamentos |
| `/ContaPagarReceber` | Contas a pagar/receber |
| `/Liberacoes` | Liberações |
| `/EstoqueFiliais` | Estoque por filial |

### Service Operations

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/ServiceSistema/Login` | POST | Login (usuário + senha texto puro) |
| `/ServiceSistema/LoginVendedor` | POST | Login vendedor |
| `/ServiceSistema/InfoLogin` | GET | Info de login |
| `/ServiceSistema/SelectSQL` | POST | ⚠️ SQL raw |
| `/ServiceSistema/Cep` | GET | Consulta CEP |
| `/ServiceProdutos/SuperBusca` | GET | Busca avançada de produtos |
| `/ServiceProdutos/MarkupMargemProduto` | GET | Markup/margem |
| `/ServiceVendas/NovoOrcamento` | POST | Criar orçamento |
| `/ServiceVendas/NovoItemOrcamento` | POST | Criar item orçamento |
| `/ServiceVendas/ExcluirItemOrcamento` | POST | Excluir item orçamento |
| `/ServiceVendas/NovaPreVenda` | POST | Criar pre-venda |
| `/ServiceVendas/GerarPendencias` | POST | Gerar pendências |
| `/ServiceVendas/expedicao/lista` | GET | Lista expedição |
| `/ServiceClientes/ListaHistoricoVendas` | GET | Histórico de vendas |
| `/ServiceClientes/EstatisticasCliente` | GET | Estatísticas cliente |
| `/ServiceClientes/InclusaoRapida` | POST | Inclusão rápida cliente |
| `/ServiceUsuarios/RotinasUsuarioPodeVer` | GET | Rotinas do usuário |
| `/ServiceUsuarios/UsuarioPoderes` | GET | Permissões |

### Mapeamento de Tipos (XData → TypeScript)

| XData | TypeScript |
|-------|------------|
| String | `string` |
| Int32/Int64 | `number` |
| Double/Decimal | `number` |
| Date | `string` |
| DateTime | `string` |
| Boolean | `boolean` |
| $ref não expandido | `string \| null` |
| `$expand` | tipo do objeto |

### Padrão @xdata.proxy

```typescript
// Campo expandido → objeto
CLIENTE: iCliente;
// Campo não expandido → proxy
'FORNECEDOR@xdata.proxy': string;
// $ref sem expand e sem proxy → nullable
IDCartaoVenda: string | null;
```

### Client HTTP

```typescript
import { CustomFetch } from '@/services/api';
// Resposta: { status, statusText, body: T }
const res = await CustomFetch<iResultado>(`/Clientes?$filter=CIC eq '123'`);
```

### Ler o Swagger Spec

```bash
curl -o /tmp/swagger.json http://emsoft02.ddns.net:2002/emsoft/emauto/openapi/swagger.json
python3 -c "
import json
spec = json.load(open('/tmp/swagger.json'))
# Definições: EMSoft.DTO.<Modulo>.T<Entidade>
print(json.dumps(spec['definitions']['EMSoft.DTO.Financeiro.TContaPagarReceber'], indent=2))
"
```
