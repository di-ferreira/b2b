# Servidor XData: criação e configuração

Índice:
1. Três formas de criar o servidor
2. TXDataServerModule (classe principal)
3. IDBConnectionPool e IDBConnectionFactory
4. Componentes de design-time
5. XData Model e TXDataModelBuilder
6. Múltiplos servidores e modelos
7. Roteamento conflitante, CORS e middlewares

---

## 1. Três formas de criar o servidor

### a) Wizards (mais rápido)

`File > New > Other > Delphi Projects > TMS XData > TMS XData VCL Server`.
Gera uma aplicação VCL que sobe um servidor via http.sys em
`http://localhost:2001/tms`. O projeto gerado usa os componentes de design-time,
então configurá-lo é configurar os componentes.

Há também o wizard `TMS XData Service` (categoria TMS Business), que gera o par
contrato/implementação de um serviço, com opções: nome do serviço, gerar
interface e implementação em units separadas (recomendado — permite reusar a
interface no cliente), adicionar métodos de exemplo, e usar um model específico.

### b) Componentes de design-time

1. Solte um dispatcher (ex. `TSparkleHttpSysDispatcher`) no form/data module.
2. Solte um `TXDataServer`.
3. Ligue `TXDataServer.Dispatcher` ao dispatcher.
4. Defina `BaseUrl` (ex. `http://+:2001/tms/xdata`).
5. `Dispatcher.Active := True`.

Para ter pool de conexões pronto:

6. Solte um `TAureliusConnection` e configure-o (normalmente ligando-o a um
   `TFDConnection` via `AdaptedConnection`).
7. Solte um `TXDataConnectionPool` e ligue-o ao `TAureliusConnection` pela
   propriedade `Connection`.
8. Ligue `TXDataServer.Pool` ao `TXDataConnectionPool`.

Dica: clicando com o botão direito no `TAureliusConnection` há a opção
"Generate entities from the database", que gera as classes Aurelius a partir do
schema existente.

### c) Em código (100% sem componentes)

```delphi
uses
  Sparkle.HttpSys.Server, XData.Server.Module,
  XData.Aurelius.ConnectionPool,
  Aurelius.Drivers.Interfaces, Aurelius.Drivers.Base,
  Aurelius.Drivers.FireDac, Aurelius.Sql.MSSQL, Aurelius.Schema.MSSQL;

procedure StartServer;
var
  Server: THttpSysServer;
begin
  Server := THttpSysServer.Create;
  try
    Server.AddModule(TXDataServerModule.Create(
      'http://localhost:2001/tms/music',
      TDBConnectionPool.Create(15, TDBConnectionFactory.Create(
        function: IDBConnection
        var
          DM: TDBDataModule;
        begin
          DM := TDBDataModule.Create(nil);
          Result := TFireDacConnectionAdapter.Create(DM.FDConnection1, DM);
        end))));
    Server.Start;
    WriteLn('Server started. Press ENTER to stop.');
    ReadLn;
  finally
    Server.Free;   // não esqueça de destruir o servidor
  end;
end;
```

Variante para testes com SQLite em memória (uma conexão só, sem pool real):

```delphi
Connection := TSQLiteNativeConnectionAdapter.Create(':memory:');
UpdateDatabase(Connection);   // rotina Aurelius que cria o schema
Server.AddModule(TXDataServerModule.Create('http://localhost:2001/tms/music',
  TDBConnectionPool.Create(1,
    function: IDBConnection
    begin
      Result := Connection;
    end)));
```

As units de driver/dialeto/schema do Aurelius (`Aurelius.Drivers.X`,
`Aurelius.Sql.X`, `Aurelius.Schema.X`) precisam estar no uses, senão o Aurelius
não sabe gerar SQL para aquele banco.

### Reserva de URL (http.sys)

O servidor http.sys exige reserva da URL no Windows. A instalação do Sparkle já
reserva `http://+:2001/tms`. Qualquer outra porta ou raiz precisa ser reservada
manualmente, senão o `Server.Start` falha.

---

## 2. TXDataServerModule

Declarado em `XData.Server.Module`. É a classe que efetivamente implementa o
servidor XData — um módulo Sparkle associado a uma URL raiz, que responde a
qualquer requisição cuja URL comece por ela.

Construtores:

```delphi
constructor Create(const ABaseUrl: string); overload;
constructor Create(const ABaseUrl: string; AConnectionPool: IDBConnectionPool); overload;
constructor Create(const ABaseUrl: string; AConnectionPool: IDBConnectionPool;
  AModel: TXDataAureliusModel); overload;
constructor Create(const ABaseUrl: string; AConnection: IDBConnection); overload;
constructor Create(const ABaseUrl: string; AConnection: IDBConnection;
  AModel: TXDataAureliusModel); overload;
```

As versões que recebem `IDBConnection` criam internamente um pool de uma conexão
só — úteis para teste e depuração, **não** para produção.

O model passado no construtor **não** é destruído pelo módulo; destrua-o você.

### Propriedades principais

| Propriedade | Descrição |
|---|---|
| `UserName`, `Password` | Basic Authentication simples embutida. Vazios por padrão (sem autenticação). Se usar, use HTTPS — as credenciais trafegam em texto puro. Para algo mais robusto, use o mecanismo de Basic Auth do Sparkle ou JWT. |
| `AccessControlAllowOrigin: string` | Habilita CORS para os hosts indicados; `'*'` aceita qualquer origem, incluindo respostas a preflight. |
| `DefaultExpandLevel: Integer` | Nível mínimo em que entidades associadas são serializadas inline. Padrão 0 (tudo vira referência). Cliente pode sobrescrever com o header `xdata-expand-level`. |
| `Events: TXDataModuleEvents` | Container dos eventos server-side (ver `events-and-security.md`). |
| `PutMode: TXDataPutMode` | `Update` ou `Merge` (padrão). Raramente precisa mudar; existe por compatibilidade. Header `xdata-put-mode` sobrescreve por requisição. |
| `SerializeInstanceRef: TInstanceRefSerialization` | Como `$ref` aparece no JSON. Header `xdata-serialize-instance-ref`. |
| `SerializeInstanceType: TInstanceTypeSerialization` | Quando a anotação `@xdata.type` aparece. Header `xdata-serialize-instance-type`. |
| `UnknownMemberHandling: TUnknownMemberHandling` | O que fazer com propriedade desconhecida no JSON recebido. |
| `RoutingPrecedence: TRoutingPrecedence` | Quem ganha quando URL de service operation conflita com CRUD endpoint. |
| `EnableEntityKeyAsSegment: Boolean` | Quando True, aceita `/entityset/id` além de `/entityset(id)`. Padrão False. |
| `SwaggerOptions`, `SwaggerUIOptions` | Ver `openapi-swagger.md`. |

Método: `procedure SetEntitySetPermissions(const EntitySetName: string; Permissions: TEntitySetPermissions)`.

### Enumerações

`TInstanceRefSerialization`
- `Always` — `$ref` sempre que a mesma instância reaparece na árvore. Padrão;
  otimizado para o `TXDataClient`.
- `IfRecursive` — `$ref` só em ocorrências recursivas (objeto dentro de si
  mesmo); nos demais casos o objeto é repetido inline. Melhor para clientes
  JavaScript e outros não-Delphi, que não querem resolver referências.

`TInstanceTypeSerialization`
- `Always` — `@xdata.type` sempre presente (padrão).
- `IfNeeded` — só quando o tipo é descendente do tipo esperado da requisição.

`TUnknownMemberHandling`
- `Error` — levanta `InvalidJsonProperty` (padrão).
- `Ignore` — ignora a propriedade desconhecida e processa a requisição.

`TRoutingPrecedence`
- `Crud` — CRUD endpoint tem precedência (padrão).
- `Service` — service operation tem precedência.

---

## 3. IDBConnectionPool e IDBConnectionFactory

Ambas declaradas em `Aurelius.Drivers.Interfaces`.

```delphi
IDBConnectionFactory = interface
  function CreateConnection: IDBConnection;
end;

IDBConnectionPool = interface
  function GetConnection: IDBConnection;
end;
```

**Fluxo:** chega uma requisição → o módulo pede uma `IDBConnection` ao pool → o
pool devolve uma livre ou pede à factory que crie uma nova → ao fim do
processamento a conexão volta ao pool. Se o pool atingir o máximo, novas
requisições **esperam** até liberar uma conexão.

Implementações prontas:
- `TDBConnectionFactory` (unit `Aurelius.Drivers.Base`) — recebe um método
  anônimo que cria a `IDBConnection`. Implementa **também** `IDBConnectionPool`,
  criando uma conexão nova a cada pedido (sem pooling).
- `TDBConnectionPool` (unit `XData.Aurelius.ConnectionPool`) — recebe o tamanho
  máximo e uma `IDBConnectionFactory` **ou** diretamente um método anônimo.

```delphi
ConnectionPool := TDBConnectionPool.Create(
  50,                       // máximo de conexões simultâneas
  function: IDBConnection
  var
    SQLConn: TSQLConnection;
  begin
    SQLConn := TSQLConnection.Create(nil);
    // ...configuração...
    Result := TDBExpressConnectionAdapter.Create(SQLConn, True);
  end);
```

**Regra crítica:** cada `IDBConnection` precisa do seu **próprio** componente de
acesso a dados. Duas conexões não podem compartilhar o mesmo `TFDConnection`/
`TSQLConnection`. Se você instancia um data module por conexão, passe-o como
segundo parâmetro do adapter para que ele seja destruído junto com a interface:

```delphi
DM := TMyDataModule.Create(nil);
Result := TFireDacConnectionAdapter.Create(DM.FDConnection1, DM);
```

---

## 4. Componentes de design-time

São wrappers sobre as classes acima; existem para dar experiência RAD. Detalhes
de arquitetura (middlewares, features comuns) vêm do TMS Sparkle.

### TXDataServer

Envolve o `TXDataServerModule`. A maioria das propriedades tem correspondência
direta com as do módulo.

| Propriedade | Descrição |
|---|---|
| `Pool: TXDataConnectionPool` | Pool usado nas operações de banco. |
| `ModelName: string` | Nome do model usado para criar o módulo. |
| `DefaultExpandLevel`, `PutMode`, `PostMode`, `FlushMode`, `ProxyLoadDepth`, `ProxyListLoadDepth`, `SerializeInstanceRef`, `SerializeInstanceType`, `UnknownMemberHandling` | Repassadas ao módulo na criação. |
| `DefaultEntitySetPermissions: TEntitySetPermissions` | **Atenção à diferença:** no componente, por padrão **nenhuma** permissão é concedida (entidades não são publicadas). Criando `TXDataServerModule` diretamente, tudo é publicado com permissão total. |
| `EntitySetPermissions: TEntitySetPermissionItems` | Coleção para sobrescrever permissões por entity set. |
| `EnableEntityKeyAsSegment: Boolean` | `/entityset/id` além de `/entityset(id)`. Padrão False. |
| `SwaggerOptions`, `SwaggerUIOptions` | Configuração de OpenAPI/SwaggerUI. |

Eventos:

| Evento | Descrição |
|---|---|
| `OnModuleCreate: TXDataModuleEvent` | Disparado quando a instância de `TXDataServerModule` é criada. Assinatura: `procedure(Sender: TObject; Module: TXDataServerModule) of object`. É o ponto para configurações que não têm propriedade no componente. |
| `OnGetPoolInterface: TGetPoolInterfaceEvent` | `procedure(Sender: TObject; var Pool: IDBConnectionPool) of object` — permite substituir o pool criado. |
| `OnEntityInserting`, `OnEntityModifying`, `OnEntityDeleting`, `OnEntityGet`, `OnEntityList`, `OnModuleException`, `OnManagerCreate` | Wrappers dos eventos server-side; mesmos argumentos. Ver `events-and-security.md`. |

### TXDataConnectionPool

Cria `IDBConnectionPool` a partir de um `TAureliusConnection`.

| Propriedade | Descrição |
|---|---|
| `Connection: TAureliusConnection` | Componente usado para criar as `IDBConnection`. |
| `Size: Integer` | Tamanho do pool. |

Evento `OnPoolInterfaceCreate: TPoolInterfaceEvent`
(`procedure(Sender: TObject; var Pool: IDBConnectionPool) of object`) — permite
substituir o pool por uma implementação própria.

---

## 5. XData Model e TXDataModelBuilder

O XData Model (`TXDataAureliusModel`, unit `XData.Aurelius.Model`) descreve tudo
que o servidor publica: service contracts, entity types, entity sets,
propriedades, enum types. Ele é construído automaticamente a partir do
`TMappingExplorer` do Aurelius e dos atributos `[ServiceContract]`/
`[ServiceImplementation]` — na esmagadora maioria dos casos você **não** precisa
criá-lo.

Conceitos:
- **Service/Contract** — conjunto de service operations definido por uma interface.
- **Enum Type** — tipo escalar com lista de nomes/valores.
- **Entity Set** — o CRUD endpoint em si; container lógico das instâncias de um
  entity type e seus descendentes. Análogo (mas não idêntico) a uma tabela.
- **Entity Type** — a "definição de classe" usada pelo XData; suporta herança.
- **Simple Property** — propriedade escalar (com facetas: nullable, tamanho máximo).
- **Navigation Property** — associação para outro entity type, simples ou coleção.

### Regras de nomes (padrão)

- classe `TCustomer` → entity type/entity set `Customer` (remove o `T`)
- campo mapeado `FName` → propriedade `Name` (remove o `F`)
- interface `IMyService` → segmento de URL `MyService` (remove o `I`)
- só membros **mapeados** no Aurelius viram propriedades; `[Transient]` fica de fora

### Construindo o model manualmente

Use quando quiser mudar essas convenções globalmente:

```delphi
uses
  XData.Aurelius.ModelBuilder, XData.Aurelius.Model,
  XData.Server.Module, Aurelius.Mapping.Explorer;

Explorer := TMappingExplorer.DefaultInstance;
Model := TXDataAureliusModel.Create(Explorer);
try
  Builder := TXDataModelBuilder.Create(Model);
  try
    Builder.UseOriginalClassNames := True;   // mantém o "T"
    Builder.UseOriginalFieldNames := True;   // mantém o "F"
    Builder.Build;
  finally
    Builder.Free;
  end;
except
  Model.Free;
  raise;
end;
Module := TXDataServerModule.Create(MyServerUrl, MyConnectionPool, Model);
```

`TXDataModelBuilder` (unit `XData.Aurelius.ModelBuilder`):

| Membro | Descrição |
|---|---|
| `UseOriginalClassNames: Boolean` | Não remove o `T` do nome da classe. |
| `UseOriginalFieldNames: Boolean` | Não remove o `F` do nome do campo. |
| `UseOriginalContractNames: Boolean` | Não remove o `I` do nome da interface. |
| `function AddEntitySet(AClass: TClass): TXDataEntitySet` | Cria entity set (e o entity type) para uma classe Aurelius. |
| `procedure AddService<T>` | Adiciona um service contract: `Model.AddService<IMyService>;` |
| `procedure RemoveEntitySet(AClass: TClass)` | Remove um entity set criado automaticamente — útil para publicar tudo menos algumas entidades. |

O builder só considera contratos que pertençam ao **mesmo model** do
`TMappingExplorer` usado.

---

## 6. Múltiplos servidores e modelos

Você pode ter vários `TXDataServerModule` em endereços diferentes, cada um com
seu model. Classes e interfaces são atribuídas a um model pelo atributo
`[Model('Nome')]` (de `Aurelius.Mapping.Attributes`):

```delphi
[ServiceContract]
[Model('Sample')]
IMyService = interface(IInvokable)
```

```delphi
XDataSampleModule := TXDataServerModule.Create(
  'http://server:2001/tms/xdata/sample',
  SampleConnectionPool, TXDataAureliusModel.Get('Sample'));

XDataSecurityModule := TXDataServerModule.Create(
  'http://server:2001/tms/xdata/security',
  SecurityConnectionPool, TXDataAureliusModel.Get('Security'));

HttpServer.AddModule(XDataSampleModule);
HttpServer.AddModule(XDataSecurityModule);
```

O filtro por model vale para **ambos** os mecanismos: só entram no módulo as
entidades e os service contracts marcados com aquele model. No cliente, passe o
model ao construtor: `TXDataClient.Create(TXDataAureliusModel.Get('Security'))`.

---

## 7. Roteamento conflitante, CORS e middlewares

### Conflito entre service operations e CRUD endpoints

Por padrão (`RoutingPrecedence = Crud`) os CRUD endpoints vencem a partir do nome
do entity set: se existe o entity set `Customers/`, **qualquer** subpath abaixo
dele é tratado pelo processador de CRUD, mesmo que não exista — `Customers/Dummy/`
retorna 404 em vez de cair na sua service operation.

Mudar para `TRoutingPrecedence.Service` inverte isso: a URL declarada na service
operation é usada, mesmo conflitando com o CRUD endpoint. Use quando quiser
sobrescrever deliberadamente um endpoint automático.

### CORS

Para clientes web (TMS Web Core, SPA em JS) servidos de outro host, ou o
`AccessControlAllowOrigin` do módulo é configurado, ou um middleware de CORS do
Sparkle é adicionado. Sem isso o browser bloqueia a requisição antes mesmo de ela
chegar ao servidor — o erro aparece no console do browser, não no log do servidor.

### Middlewares

Middlewares são do Sparkle e se aplicam ao módulo:

```delphi
Module.AddMiddleware(TJwtMiddleware.Create('secret'));
```

Em design-time, clique com o botão direito no `TXDataServer` e use a opção de
gerenciar a lista de middlewares. Detalhes do JWT em `events-and-security.md`.
