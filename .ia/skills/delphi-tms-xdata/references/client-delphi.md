# TXDataClient (cliente Delphi)

Declarado em `XData.Client`. Permite conversar com um servidor XData de forma
tipada e de alto nível, a partir de aplicações Delphi desktop/mobile. Sob o capô
usa o `THttpClient` do Sparkle.

Para TMS Web Core, o cliente é outro — ver `webcore.md`.

Índice:
1. Uso básico
2. Invocando service operations
3. Gerenciamento de memória no cliente
4. CRUD endpoints
5. Query builder
6. Multi-model
7. Autenticação
8. Propriedades desconhecidas

---

## 1. Uso básico

```delphi
uses XData.Client;

Client := TXDataClient.Create;
Client.Uri := 'http://server:2001/tms/xdata';
// ...usa o client...
Client.Free;
```

`Uri` é a URL raiz do servidor XData.

---

## 2. Invocando service operations

Reusa-se a **mesma interface** declarada no servidor — sem gerar proxy, sem
duplicar código, sem montar URL nem fazer binding de parâmetro na mão.

```delphi
uses MyServiceInterface, XData.Client;

var
  Client: TXDataClient;
  MyService: IMyService;
  SumResult: Double;
begin
  Client := TXDataClient.Create;
  Client.Uri := 'http://server:2001/tms/xdata';
  MyService := Client.Service<IMyService>;
  SumResult := MyService.Sum(5, 10);
end;
```

Passos: `Service<I>` para obter a interface, depois chamar os métodos.

Por isso o wizard sugere gerar contrato e implementação em units separadas: a unit
do contrato é a única compartilhada entre servidor e cliente.

---

## 3. Gerenciamento de memória no cliente

**As regras são diferentes das do servidor.** No cliente:

- objetos **enviados** ao servidor (parâmetros) **não** são destruídos — você cuida;
- objetos do tipo `TStream` ou `TList<T>` **retornados** do servidor **não** são
  destruídos — você cuida;
- qualquer **outro** objeto retornado do servidor **é destruído automaticamente**.

```delphi
var
  Customer: TCustomer;
  Invoices: TList<TInvoice>;
begin
  Invoices := Client.Service<ISomeService>.DoSomething(Customer);
  Customer.Free;   // parâmetro: seu
  Invoices.Free;   // TList<T>: seu
  // os TInvoice DENTRO da lista são destruídos pelo client — não os libere
end;
```

Isso vale igualmente para `Post`, `Put`, `Delete`, `Get` e `List`.

Para desligar o gerenciamento automático de entidades:

```delphi
Client.ReturnedInstancesOwnership := TInstanceOwnership.None;
```

Para inspecionar (ou destruir manualmente) o que o client criou:

```delphi
for Entity in Client.ReturnedEntities do { ... };
```

`ReturnedEntities` também aceita adições — é assim que se registra, por exemplo,
um `TXDataQuery` criado manualmente para que o client o destrua.

---

## 4. CRUD endpoints

### Entidade única

```delphi
Customer := Client.Get<TCustomer>(10);
State    := Client.Get<TState>('FL');
```

`Id` é `TValue`, com conversões implícitas para integer, string etc. Sem conversão
implícita, use a sobrecarga com dois genéricos:

```delphi
var
  InvoiceId: TGuid;
begin
  Invoice := Client.Get<TInvoice, TGuid>(InvoiceId);
end;
```

Versão não-genérica, para tipo conhecido só em runtime (devolve `TObject`):

```delphi
Customer := TCustomer(Client.Get(TCustomer, 10));
```

### Lista

```delphi
Fishes := Client.List<TFish>;
```
`List<T>` **sempre cria** um `TList<T>`, que é seu para destruir.

Com query string:

```delphi
Customers := Client.List<TCustomer>(
  '$filter=(Name eq ''Paul'') or (Birthday lt 1940-08-01)&$orderby=Name desc');
```

Versão não-genérica (devolve `TList<TObject>`):

```delphi
var
  Fishes: TList<TObject>;
begin
  Fishes := XClient.List(TFish);
```

### Contagem

```delphi
TotalFishes := Client.Count(TFish);
TotalCustomers := Client.Count(TCustomer,
  '$filter=(Name eq ''Paul'') or (Birthday lt 1940-08-01)&$orderby=Name desc');
```

### Criar

```delphi
C := TCountry.Create;
try
  C.Name := 'Germany';
  Client.Post(C);
finally
  C.Free;    // parâmetro: seu
end;
```
Após um `Post` bem-sucedido, o `Id` do objeto é preenchido se for gerado pelo servidor.

### Atualizar

```delphi
Customer := Client.Get<TCustomer>(10);
Customer.City := 'London';
Client.Put(Customer);
```
`Put` não destrói o objeto — mas neste exemplo ele veio de um `Get`, então o
client o gerencia e você **não** deve liberá-lo.

### Remover

```delphi
Customer := Client.Get<TCustomer>(10);
Client.Delete(Customer);   // passa-se o objeto, não o id
```
Mesma observação sobre propriedade do objeto.

### PostFetch e PutFetch (5.23+)

`TXDataClient.PostFetch` e `TXDataClient.PutFetch` fazem POST/PUT **e** recuperam
do servidor o objeto atualizado — útil quando o servidor preenche campos
calculados, timestamps ou triggers.

### EntityKeyAsSegment (5.27+)

`TXDataClient.EntityKeyAsSegment := True` faz o client montar URLs no formato
`/Customer/1` em vez de `/Customer(1)`. O servidor precisa ter
`EnableEntityKeyAsSegment` ligado.

---

## 5. Query builder

Alternativa a escrever a query string na mão. Units `XData.QueryBuilder` e
`Aurelius.Criteria.Linq`.

```delphi
uses XData.QueryBuilder, Aurelius.Criteria.Linq;

Customers := Client.List<TCustomer>(
  CreateQuery
    .From(TCustomer)
    .Filter(
      (Linq['Name'] = 'Paul')
      or (Linq['Birthday'] < EncodeDate(1940, 8, 1))
    )
    .OrderBy('Name', False)
    .QueryString
);
```

### Filter e FilterRaw

`Filter` recebe uma expressão de criteria Aurelius e a converte para a sintaxe de
`$filter`. `FilterRaw` recebe a string pronta.

```delphi
CreateQuery.From(TCustomer).Filter(Linq['Name'] = 'Paul').QueryString
// $filter=Name eq Paul

CreateQuery.From(TCustomer).FilterRaw('Name eq Paul').QueryString
```

### OrderBy e OrderByRaw

`OrderBy` recebe um nome de propriedade (string) ou uma projeção Aurelius, mais um
booleano opcional: `True` (padrão) = ascendente, `False` = descendente.

```delphi
CreateQuery.From(TCustomer).OrderBy('Name').OrderBy('Id', False).QueryString
// $orderby=Name,Id desc

CreateQuery.From(TCustomer).OrderBy(Linq['Birthday'].Year).QueryString
// $orderby=year(Birthday)

CreateQuery.From(TCustomer).OrderByRaw('year(Birthday)').QueryString
```

### Top e Skip

```delphi
CreateQuery.Top(10).Skip(30).QueryString   // $top=10&$skip=30
```

### Expand

```delphi
CreateQuery.From(TInvoice).Expand('Customer').Expand('Product').QueryString
// $expand=Customer,Product
```

### Subpropriedades

No builder use **ponto**; o resultado usa barra:

```delphi
CreateQuery.From(TCustomer).Filter(Linq['Country.Name'] = 'Germany').QueryString
// $filter=Country/Name eq 'Germany'
```

### From

Necessário quando a query referencia nomes de propriedade — é o que permite ao
builder validar nomes e tipos. Aceita a classe ou o nome do entity/instance type:

```delphi
CreateQuery.From(TCustomer)
CreateQuery.From('Customer')
```

Também aceita nome de instance type (um DTO qualquer, não necessariamente entidade).

**Pegadinha:** passando a **classe**, o builder valida contra os nomes de campo e
propriedade da classe, não contra o nome final no JSON. Dada:

```delphi
TCustomerDTO = class
strict private
  FId: Integer;
  [JsonProperty('the_name')]
  FName: string;
```

```delphi
CreateQuery.From('Customer').Filter(Linq['the_name'] = 'Paul')      // OK (nome do modelo)
CreateQuery.From(TCustomerDTO).Filter(Linq['the_name'] = 'Paul')    // FALHA
CreateQuery.From(TCustomerDTO).Filter(Linq['Name'] = 'Paul')        // OK → $filter=the_name eq 'Paul'
```

### Build

`QueryString` devolve a string; `Build` devolve um `TXDataQuery`, para passar a
service operations que recebem esse tipo (ver `service-operations.md`, seção 9).

---

## 6. Multi-model

Por padrão o client usa o model default. Com múltiplos models, passe o desejado no
construtor:

```delphi
Client := TXDataClient.Create(TXDataAureliusModel.Get('Security'));
```

Assim o client sabe quais contratos pode invocar e quais classes pode receber.

---

## 7. Autenticação

O jeito geral é o evento `OnSendingRequest` do `THttpClient` interno, exposto em
`TXDataClient.HttpClient`:

```delphi
XDataClient.HttpClient.OnSendingRequest :=
  procedure(Req: THttpRequest)
  begin
    Req.Headers.SetValue('Authorization', 'Bearer ' + vToken);
  end;
```

Fluxo típico com JWT: fazer login por uma service operation, guardar o token,
instalar o handler.

```delphi
JwtToken := Client.Service<ILoginService>.Login(edtUser.Text, edtPassword.Text);
Client.HttpClient.OnSendingRequest :=
  procedure(Req: THttpRequest)
  begin
    Req.Headers.SetValue('Authorization', 'Bearer ' + JwtToken);
  end;
```

Todas as propriedades e eventos de `THttpClient` estão disponíveis nesse ponto.

### Basic authentication (legado)

```delphi
property UserName: string;
property Password: string;
```
Vazias por padrão (não envia nada). Equivalem a preencher o header `Authorization`
com o valor de basic auth. Use HTTPS.

---

## 8. Propriedades desconhecidas

Cliente e servidor podem sair de sincronia: o servidor ganha
`TCustomer.Foo`, o cliente ainda foi compilado sem ela. Por padrão o client
**levanta exceção** ao encontrar `Foo` — o comportamento seguro, porque ignorar a
propriedade faria o cliente devolver o objeto sem ela e potencialmente limpá-la
numa atualização.

Se você aceita esse risco em troca de não precisar manter os clientes em dia:

```delphi
XDataClient1.IgnoreUnknownProperties := True;
```
