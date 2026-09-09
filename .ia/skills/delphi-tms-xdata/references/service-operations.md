# Service Operations

Índice:
1. Contrato e implementação
2. Roteamento
3. Binding de parâmetros
4. Tipos suportados
5. Valores de retorno
6. Parâmetros default e validação
7. Gerenciamento de memória no servidor
8. TXDataOperationContext
9. TXDataQuery (recebendo consultas em service operations)

---

## 1. Contrato e implementação

Toda service operation nasce de um par: uma **interface** (service contract),
que descreve o endpoint e pode ser compartilhada com o cliente Delphi, e uma
**classe** (service implementation), que só existe no servidor.

### Contrato

Passos: interface herdando de `IInvokable`, com GUID (Shift+Ctrl+G), unit
`XData.Service.Common` no uses, atributo `[ServiceContract]`, métodos declarados,
e `RegisterServiceType(TypeInfo(...))` na `initialization`.

```delphi
unit MyServiceInterface;
interface
uses System.Classes, Generics.Collections, XData.Service.Common;

type
  [ServiceContract]
  IMyService = interface(IInvokable)
  ['{BAD477A2-86EC-45B9-A1B1-C896C58DD5E0}']
    function Sum(A, B: Double): Double;
    function HelloWorld: string;
  end;

implementation
initialization
  RegisterServiceType(TypeInfo(IMyService));
end.
```

Para associar o contrato a um model específico (multi-model), adicione
`[Model('Sample')]` (unit `Aurelius.Mapping.Attributes`).

### Implementação

Classe herdando de `TInterfacedObject` (ou que implemente contagem de referência
por conta própria), com `[ServiceImplementation]`, implementando todos os métodos,
e `RegisterServiceType(TClasse)` na `initialization`.

```delphi
unit MyService;
interface
uses System.Classes, Generics.Collections, MyServiceInterface, XData.Service.Common;

type
  [ServiceImplementation]
  TMyService = class(TInterfacedObject, IMyService)
  private
    function Sum(A, B: Double): Double;
    function HelloWorld: string;
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

**Ciclo de vida:** a cada requisição o servidor localiza a classe pelo roteamento,
**cria uma instância nova**, faz o binding dos parâmetros, invoca o método,
serializa o retorno e **destrói a instância**. Não guarde estado em campos da
classe de implementação esperando que ele sobreviva entre requisições.

**Atributos vão no contrato.** Atributos na classe de implementação são ignorados.

---

## 2. Roteamento

Roteamento é o mecanismo que decide, a partir do método HTTP e da URL, qual
operação invocar.

### Padrão

`POST <Service>/<Action>`, onde `<Service>` é o nome da interface sem o `I` e
`<Action>` é o nome do método.

```delphi
IMyService = interface(IInvokable)
  function Sum(A, B: Double): Double;
```
→ `POST /MyService/Sum`

### Mudando o método HTTP

Atributos `HttpGet`, `HttpPut`, `HttpDelete`, `HttpPatch`, `HttpPost` (este
último é o padrão, raramente necessário):

```delphi
[HttpGet] function Sum(A, B: Double): Double;
```
→ `GET /MyService/Sum`

### Route

Muda o caminho, na interface e/ou no método. Aceita múltiplos segmentos e string
vazia.

```delphi
[Route('Math/Arithmetic')]
IMyService = interface(IInvokable)
  [Route('Operations/Add')]
  function Sum(A, B: Double): Double;
```
→ `POST /Math/Arithmetic/Operations/Add`

```delphi
[Route('Math/Arithmetic')]
IMyService = interface(IInvokable)
  [Route('')]
  function Sum(A, B: Double): Double;
```
→ `POST /Math/Arithmetic`

Com placeholders de parâmetro:

```delphi
[Route('Math')]
IMyService = interface(IInvokable)
  [Route('{A}/Plus/{B}')]
  function Sum(A, B: Double): Double;
```
→ `POST /Math/10/Plus/5`

### Substituindo a URL raiz

Por padrão um GET na raiz devolve um service document. Para substituir:

```delphi
[ServiceContract]
[Route('')]
IRootService = interface(IInvokable)
['{80A69E6E-CA89-41B5-A854-DFC412503FEA}']
  [HttpGet, Route('')]
  function Root: TArray<string>;
end;
```
→ `GET /` invoca `IRootService.Root`.

### Conflito com CRUD endpoints

Ver `RoutingPrecedence` em `server-setup.md`. Resumo: por padrão o CRUD endpoint
vence a partir do nome do entity set, e qualquer subpath sob ele (mesmo
inexistente) devolve 404 em vez de cair na service operation.

---

## 3. Binding de parâmetros

Cada parâmetro pode vir de três lugares: corpo JSON (`FromBody`), query string
(`FromQuery`) ou segmento da URL (`FromPath`). Sem atributo explícito, valem as
regras de default, **nesta ordem**:

1. Parâmetro citado no `Route` → **FromPath**, independentemente do método HTTP.
2. Senão, se o método HTTP é GET → **FromQuery**.
3. Senão (POST, PUT, PATCH, DELETE) → **FromBody**.

### FromBody

Objeto JSON no corpo, um par nome/valor por parâmetro.

```delphi
[HttpPost] function Multiply([FromBody] A: Double; [FromBody] B: Double): Double;
```
```http
POST /tms/xdata/MathService/Multiply
{ "a": 5, "b": 8 }
```

### FromQuery

Pares `name=value` na query string, valores formatados como literais de URI
(ver `crud-endpoints.md`). **Só aceita valores escalares**, ou objetos cujas
propriedades sejam todas escalares.

```delphi
[HttpPost] function Multiply([FromQuery] A: Double; [FromQuery] B: Double): Double;
```
→ `POST /tms/xdata/MathService/Multiply?a=5&b=8`

DTOs escalares também funcionam — cada propriedade vira um query param:

```delphi
[HttpGet] function FindByIdOrName(Customer: TCustomerDTO): TList<TCustomer>;
```
→ `GET /tms/xdata/CustomerService/FindByIdOrName?Id=10&Name='Paul'`

> Cuidado: usar objetos como parâmetro em query string quebra clientes TMS Web
> Core compilados com XData anterior a 5.2. Recompile os clientes.

### FromPath

Segmentos da URL, na ordem em que os parâmetros `FromPath` são declarados.

```delphi
[HttpGet] function Multiply([FromPath] A: Double; [FromPath] B: Double): Double;
```
→ `GET /tms/xdata/MathService/Multiply/5/8`  (A=5, B=8)

Parâmetros citados no `Route` já são FromPath; os demais marcados como FromPath
entram como segmentos adicionais ao final:

```delphi
[Route('{A}/Multiply')]
[HttpGet] function Multiply(A: Double; [FromPath] B: Double): Double;
```
→ `GET /tms/xdata/MathService/5/Multiply/8`

### Misturando

```delphi
procedure Process(
  [FromPath]  PathA: Integer;
  [FromQuery] QueryA: string;
              BodyA, BodyB: string;
  [FromQuery] QueryB: Boolean;
  [FromPath]  PathB: string
): Double;
```
```http
POST /tms/xdata/MyService/Process/5/value?QueryA=queryvalue&QueryB=true
{ "BodyA": "one", "BodyB": "two" }
```
Resultado: PathA=5, QueryA=queryvalue, BodyA=one, BodyB=two, QueryB=true, PathB=value.

### Casos especiais

- **Único parâmetro FromBody que é objeto:** o cliente envia a representação JSON
  do objeto **direto** no corpo, sem envolvê-la no nome do parâmetro.
  ```delphi
  procedure UpdateCustomer(C: TCustomer);   // corpo = o JSON do customer
  ```
- **Único parâmetro FromBody escalar:** além do nome real do parâmetro, o cliente
  pode usar o nome `"value"`. Ambos funcionam.
  ```delphi
  procedure ChangeVersion(const Version: string);
  ```

---

## 4. Tipos suportados

| Tipo | Comportamento |
|---|---|
| Escalares (`Integer`, `String`, `Double`, `Boolean`, `TDateTime`, `TGUID` e variações como `Longint`, `Int64`, `TDate`) | Representação JSON padrão. `Variant` também, desde que o valor seja um dos tipos suportados. |
| Enumerados e conjuntos | Enum vira string com o nome do valor; conjunto vira array JSON de strings. |
| PODO (objeto Delphi comum) | Serializado como objeto JSON; típico para DTOs e parâmetros estruturados. |
| Entidades Aurelius | Caso especial de objeto, com regras próprias para proxies e associações (ver `json-format.md`). |
| `TList<T>` | T pode ser qualquer tipo suportado. Se T for entidade, usa a representação de coleção de entidades; senão, array JSON simples. |
| `TArray<T>` | Array JSON de valores. |
| `TJSONAncestor` e descendentes (XE6+): `TJSONObject`, `TJSONArray`, `TJSONString`, `TJSONNumber`, `TJSONBool`, `TJSONTrue`, `TJSONFalse`, `TJSONNull` | Transferência de JSON cru, sem marshalling. |
| `TCriteriaResult` / `TList<TCriteriaResult>` | Para projeções Aurelius. Cada item vira um objeto JSON com uma propriedade por valor projetado. |
| `TStrings` | Array JSON de strings. Só como propriedade de objeto (com instância já criada) ou como resultado de função (crie a instância). **Não pode** ser parâmetro de service operation. |
| `TStream` | Sem marshalling: o stream é o corpo bruto da requisição/resposta. |

### TCriteriaResult com projeções

```delphi
function TTestService.ProjectedCustomers(NameContains: string): TList<TCriteriaResult>;
begin
  Result := TXDataOperationContext.Current.GetManager
    .Find<TCustomer>
    .CreateAlias('Country', 'c')
    .SetProjections(TProjections.ProjectionList
      .Add(TProjections.Prop('Id').As_('Id'))
      .Add(TProjections.Prop('Name').As_('Name'))
      .Add(TProjections.Prop('c.Name').As_('Country')))
    .Where(TLinq.Contains('Name', NameContains))
    .OrderBy('Name')
    .ListValues;
end;
```
→ cada item: `{ "Id": 4, "Name": "John", "Country": "United States" }`

### TStream

```delphi
function BuildCustomDocument(CustomerId: Integer): TStream;
procedure ReceiveDocument(Value: TStream);
```

Como o `TStream` consome o corpo inteiro, ele precisa ser o **único** parâmetro
recebido pelo corpo:

```delphi
// INVÁLIDO — NumPages cairia em FromBody
[HttpPost] procedure ReceiveDocument(Value: TStream; NumPages: Integer);

// VÁLIDO
[HttpPost] procedure ReceiveDocument(Value: TStream; [FromQuery] NumPages: Integer);
```

Desde a 5.27, streams de tamanho desconhecido (`Size` negativo, não-seekable)
são enviados com chunked transfer encoding e copiados em blocos, o que reduz o
uso de memória com streams grandes.

Para definir o content-type de um resultado binário, use o response do contexto
(ver seção 8).

---

## 5. Valores de retorno

Sucesso: **200 OK** com corpo, ou **204 No Content** para procedures.

Regra geral: o valor vem envolvido num objeto JSON com o par `"value"`:

```json
{ "value": 40 }
```

Exceções:

**Parâmetros por referência** — o resultado é um objeto com uma propriedade por
parâmetro `var`/`out`; se o método for função, o retorno vem em `"result"`:

```delphi
function DoSomething(const Input: string; var Param1, Param2: Integer): Boolean;
```
```json
{ "result": true, "Param1": 50, "Param2": 30 }
```

**Retorno de objeto único** — a representação do objeto vai direto no corpo, sem
o envelope `"value"`:

```delphi
function FindCustomer(const Name: string): TCustomer;
```

---

## 6. Parâmetros default e validação

### Parâmetros default

Valores default do Delphi são resolvidos em **tempo de compilação** — funcionam
ao chamar via `TXDataClient` (o compilador preenche no cliente), mas não em
requisições HTTP cruas, que acusam parâmetro faltando. Para o servidor conhecer o
default, repita-o com `[XDefault]`:

```delphi
function Hello([XDefault('World')] const Name: string = 'World'): string;

procedure DoSomething(
  [XDefault('Default')] Name: string = 'Default';
  [XDefault(0)] Value: Integer = 0);
```

Só na interface; na implementação os atributos são ignorados.

### Validação de parâmetros

Atributos de validação (os mesmos do Aurelius: `Required`, `MaxLength`,
`MinLength`, `Range`, ...) só são aplicados se o método — ou a interface inteira —
tiver `[ValidateParams]`:

```delphi
[ValidateParams]
[HttpGet] function ListCitiesByState(const [Required, MaxLength(2)] State: string): TList<TCity>;
```

Se a validação falhar, o XData rejeita a requisição com **400 Bad Request** e um
JSON detalhado, sem invocar o método. Dentro do método você pode confiar que o
valor é válido.

Quando o parâmetro é uma classe, os membros mapeados dela também são validados:

```delphi
TFoo = class
strict private
  [Range(1, MaxInt)] FId: Integer;
  [MaxLength(10)] FName: string;
public
  property Id: Integer read FId write FId;
  property Name: string read FName write FName;
end;

[ValidateParams] procedure AcceptFoo([Required] Foo: TFoo);
```

Resposta de erro:

```json
{
  "error": {
    "code": "ValidationFailed",
    "message": "Validation failed",
    "errors": [
      { "code": "OutOfRange", "message": "Field Id must be between 1 and 2147483647" },
      { "code": "ValueTooLong", "message": "Field Name must have no more than 10 character(s)" }
    ]
  }
}
```

A lista completa de atributos de validação está na documentação do TMS Aurelius
(capítulo Data Validation).

---

## 7. Gerenciamento de memória no servidor

Regra geral: **você não destrói nada**. O XData destrói automaticamente:

- qualquer objeto passado como parâmetro ou retornado como resultado;
- qualquer objeto gerenciado pelo `TObjectManager` do contexto;
- o próprio `TObjectManager` do contexto, após o método retornar;
- qualquer objeto associado que seja serializado/desserializado junto com o
  parâmetro ou o resultado.

```delphi
function TMyService.DoSomething(Param: TMyParam): TMyResult;
var
  Entity: TMyEntity;
begin
  Entity := TMyEntity.Create;
  Entity.SomeProperty := Param.OtherProperty;
  TXDataOperationContext.Current.GetManager.Save(Entity);
  Result := TMyResult.Create('test');
end;
```
Nenhum dos três objetos precisa ser destruído: `Param` e `Result` são
param/result objects, e `Entity` foi entregue ao manager do contexto.

### ManagedObjects

O XData mantém a coleção `TXDataOperationContext.Current.Handler.ManagedObjects`
para controlar o que será destruído e evitar destruição dupla. Você pode
adicionar objetos a ela antecipadamente — isso substitui try/except manuais:

```delphi
// em vez disso:
function TMyService.DoSomething: TMyResult;
begin
  Result := TMyResult.Create;
  try
    // operação complexa
  except
    Result.Free;
    raise;
  end;
end;

// escreva isso:
function TMyService.DoSomething: TMyResult;
begin
  Result := TMyResult.Create;
  TXDataOperationContext.Current.Handler.ManagedObjects.Add(Result);
  // operação complexa
end;
```

### Os dois casos onde dá errado

**1. Você cria seu próprio `TObjectManager`** e nele salva/recupera entidades que
também são parâmetro ou resultado. Ao destruir seu manager, as entidades morrem
junto — e o XData tenta destruí-las de novo → Access Violation. Soluções, em
ordem de preferência: use o manager do contexto; ou use
`CreateManager`/`AddManager` do contexto; ou, em último caso,
`SeuManager.OwnsObjects := False`.

**2. Você cria objetos associados que não são serializados.** Se `TCustomer` tem
uma propriedade `Foo: TFoo` que não é associação mapeada no Aurelius (nem marcada
para serialização, se for PODO), o XData não sabe que ela existe e não a destrói:

```delphi
Result := TCustomer.Create;
Result.Foo := TFoo.Create;   // TFoo vaza
```
Destrua o objeto ou adicione-o a `ManagedObjects`. É raro, mas silencioso.

O comportamento no cliente é **diferente** — ver `client-delphi.md`.

---

## 8. TXDataOperationContext

Declarado em `XData.Server.Module`. É a porta de entrada para tudo que o servidor
oferece durante a execução da operação.

```delphi
TXDataOperationContext = class
public
  class function Current: TXDataOperationContext;
  function GetConnectionPool: IDBConnectionPool;
  function Connection: IDBConnection;
  function GetManager: TObjectManager;
  function CreateManager: TObjectManager; overload;
  function CreateManager(Connection: IDBConnection): TObjectManager; overload;
  function CreateManager(Connection: IDBConnection; Explorer: TMappingExplorer): TObjectManager; overload;
  function CreateManager(Explorer: TMappingExplorer): TObjectManager; overload;
  procedure AddManager(AManager: TObjectManager);
  function Request: THttpServerRequest;
  function Response: THttpServerResponse;
end;
```

### Manager do contexto

`GetManager` devolve um `TObjectManager` pronto, com a conexão certa, destruído
automaticamente ao fim da requisição. Usá-lo mantém a lógica de negócio
desacoplada da configuração de banco: o mesmo serviço funciona em módulos
apontando para bancos diferentes.

```delphi
function TCustomerService.FindOverduePayments(CustomerId: Integer): TList<TPayment>;
begin
  Result := TXDataOperationContext.Current.GetManager.Find<TPayment>
    .CreateAlias('Customer', 'c')
    .Where(TLinq.Eq('c.Id', CustomerId) and TLinq.LowerThan('DueDate', Now))
    .List;
end;
```

### Managers adicionais

Precisa de outro manager (outro model, outra conexão)? Use `CreateManager` — o
XData cuida da destruição:

```delphi
Manager := TXDataOperationContext.Current.CreateManager(TMappingExplorer.Get('OtherModel'));
Result := Manager.Find<TAnimal>.Where(TLinq.Eq('Name', Name)).UniqueResult;
```

Se preferir criar você mesmo, entregue-o ao contexto com `AddManager`:

```delphi
Manager := TObjectManager.Create(SomeConnection, TMappingExplorer.Get('OtherModel'));
TXDataOperationContext.Current.AddManager(Manager);
Result := Manager.Find<TAnimal>.Where(TLinq.Eq('Name', Name)).UniqueResult;
```

Os parâmetros de `CreateManager` (conexão e/ou model) são opcionais: sem eles usa
a conexão padrão e o model do módulo.

### Conexão padrão

```delphi
DefConnection := TXDataOperationContext.Current.Connection;
```
É a mesma conexão do manager padrão, obtida do pool sob demanda.

### Request e Response

Objetos do Sparkle. Servem para customizar a resposta:

```delphi
function TMyService.GetPdfReport: TStream;
begin
  TXDataOperationContext.Current.Response.Headers.SetValue('content-type', 'application/pdf');
  Result := InternalGetMyPdfReport;
end;
```

E para inspecionar a requisição, por exemplo em autenticação customizada:

```delphi
function TMyService.GetAppointment(const Id: Integer): TVetAppointment;
var
  AuthHeaderValue: string;
begin
  AuthHeaderValue := TXDataOperationContext.Current.Request.Headers.Get('custom-auth');
  if not CheckAuthorized(AuthHeaderValue) then
    raise EXDataHttpException.Create(401, 'Unauthorized');
  Result := TXDataOperationContext.Current.GetManager.Find<TVetAppointment>(Id);
end;
```

`Request.User` dá a `IUserIdentity` preenchida pelo middleware JWT — ver
`events-and-security.md`.

---

## 9. TXDataQuery

Permite que uma service operation receba os mesmos parâmetros de consulta dos
CRUD endpoints, mas mantendo controle total da lógica. Declare um parâmetro de
tipo `TXDataQuery` (unit `XData.Query`):

```delphi
IMyService = interface(IInvokable)
  [HttpGet] function List(Query: TXDataQuery): TList<TCustomer>;
```

`TXDataQuery` expõe `$filter`, `$orderby`, `$top` e `$skip` (mapeados por
`[JsonProperty]`), então os clientes chamam:

```
/MyService/List/?$filter=Name eq 'Foo'&$orderby=Name&$top=10&$skip=30
```

Do lado do servidor, converta em criteria Aurelius:

```delphi
function TMyService.List(Query: TXDataQuery): TList<TCustomer>;
begin
  Result := TXDataOperationContext.Current.CreateCriteria<TCustomer>(Query).List;
end;
```

A criteria pode ser modificada antes de executar (adicionar filtros obrigatórios,
restrições por usuário, etc.).

### Validando a query contra um DTO

Passando uma segunda classe, o XData valida os nomes de propriedade da query
contra **ela**, não contra a entidade:

```delphi
Result := TXDataOperationContext.Current
  .CreateCriteria<TCustomer>(Query, TCustomerDTO).List;
```

Assim, `$filter=Status eq 2` é rejeitado com "property Status does not exist" se
`Status` não existir em `TCustomerDTO`, mesmo existindo em `TCustomer`. É a forma
limpa de expor consulta livre sem expor todos os campos da entidade.

### Montando a query no cliente

Via string (query builder gera a URL):

```delphi
EndpointUrl := ServerBaseUrl + '/MyService/List/?' +
  CreateQuery.From(TCustomer)
    .Filter(Linq['Name'] = 'Foo')
    .OrderBy('Name')
    .Top(10).Skip(30)
    .QueryString;
```

Via `TXDataClient` com a interface, passando o objeto:

```delphi
Query := TXDataQuery.Create('Name eq ''Foo''', 'Name', 10, 30);
XClient.ReturnedEntities.Add(Query);
Customer := Client.Service<IMyService>.List(Query);
```

Ou com o builder, usando `Build` em vez de `QueryString`:

```delphi
Query := CreateQuery
  .From(TCustomer)
  .Filter(Linq['Name'] = 'Foo')
  .OrderBy('Name')
  .Top(10).Skip(30)
  .Build;
XClient.ReturnedEntities.Add(Query);
Customer := Client.Service<IMyService>.List(Query);
```
