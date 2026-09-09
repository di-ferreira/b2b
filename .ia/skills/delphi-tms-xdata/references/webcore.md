# Clientes TMS Web Core

TMS Web Core compila Delphi para HTML/JS (via pas2js), gerando SPAs que rodam no
browser. O XData é o backend natural, e traz um framework cliente próprio com
componentes de design-time.

**A diferença fundamental em relação ao `TXDataClient`: no browser tudo é
assíncrono.** Nenhum método devolve resultado imediatamente — ou você usa
eventos/callbacks, ou usa `async/await` (TMS Web Core 1.6+).

Índice:
1. Instalação no Web Designer
2. TXDataWebConnection
3. TXDataWebClient
4. TXDataWebDataset
5. Resolvendo erros comuns
6. Wizard de aplicação web

---

## 1. Instalação no Web Designer

Se você usa o designer padrão do Delphi, os componentes XData para Web Core já
estão na paleta e nada precisa ser feito.

Se o **Web Designer WYSIWYG** do TMS Web Core estiver habilitado, é preciso
compilar e instalar os pacotes específicos para Web Core, **nesta ordem**:

1. TMS BCL — `bclweb.dproj`
2. TMS Sparkle — `sparkleweb.dproj`
3. TMS XData — `xdataweb.dproj`
4. TMS Sphinx — `sphinxweb.dproj` (se disponível)

Ficam na subpasta `packages\webcore` de cada produto. Com TMS Smart Setup em
`C:\SmartSetup`:

```
C:\SmartSetup\Products\tms.biz.bcl\packages\webcore\bclweb.dproj
C:\SmartSetup\Products\tms.biz.sparkle\packages\webcore\sparkleweb.dproj
C:\SmartSetup\Products\tms.biz.xdata\packages\webcore\xdataweb.dproj
C:\SmartSetup\Products\tms.biz.sphinx\packages\webcore\sphinxweb.dproj
```

---

## 2. TXDataWebConnection

Primeiro componente a usar. Solte no form e aponte a URL para a raiz do servidor:

```delphi
XDataWebConnection1.URL := 'http://localhost:2001/tms/music';
XDataWebConnection1.Connected := True;
```

Quase tudo pode ser configurado no object inspector, inclusive testar a conexão.

**A conexão é assíncrona.** Este código não funciona:

```delphi
XDataWebConnection1.Connected := True;
PerformSomeRequestToXDataServer();   // a conexão provavelmente ainda não terminou
```

Três formas corretas:

### a) Eventos OnConnect / OnError

```delphi
procedure TForm1.ConnectButtonClick(Sender: TObject);
begin
  XDataWebConnection1.URL := 'http://localhost:2001/tms/music';
  XDataWebConnection1.OnConnect := XDataWebConnection1Connect;
  XDataWebConnection1.OnError := XDataWebConnection1Error;
  XDataWebConnection1.Connected := True;
end;

procedure TForm1.XDataWebConnection1Connect(Sender: TObject);
begin
  PerformSomeRequest;
end;

procedure TForm1.XDataWebConnection1Error(Error: TXDataWebConnectionError);
begin
  WriteLn('XData server connection failed with error: ' + Error.ErrorMessage);
end;
```

### b) Método Open com callbacks

```delphi
procedure TForm1.ConnectButtonClick(Sender: TObject);

  procedure OnConnect;
  begin
    PerformSomeRequest;
  end;

  procedure OnError(Error: TXDataWebConnectionError);
  begin
    WriteLn('XData server connection failed with error: ' + Error.ErrorMessage);
  end;

begin
  XDataWebConnection1.URL := 'http://localhost:2001/tms/music';
  XDataWebConnection1.Open(@OnConnect, @OnError);
end;
```

### c) OpenAsync + await (Web Core 1.6+) — mais legível

```delphi
procedure TForm1.ConnectButtonClick(Sender: TObject);
begin
  XDataWebConnection1.URL := 'http://localhost:2001/tms/music';
  try
    await(XDataWebConnection1.OpenAsync);
    PerformSomeRequest;
  except
    on Error: Exception do
      WriteLn('XData server connection failed with error: ' + Error.Message);
  end;
end;
```

### OnRequest

Disparado antes de **toda** requisição. É o ponto para adicionar autenticação de
forma centralizada:

```delphi
procedure TForm1.XDataWebConnection1Request(Request: TXDataWebConnectionRequest);
begin
  Request.Request.Headers.SetValue('Authorization', 'Bearer ' + LocalJWTToken);
end;
```

### DesignData

Propriedade só para design-time: headers extras enviados ao servidor, permitindo
conectar-se a ele na IDE (por exemplo, um token de autorização). Clique nas
reticências de `DesignData.Headers`.

Por segurança, esses headers **não** são salvos no DFM — você os perde ao
fechar/reabrir o projeto ou a unit. Se realmente quiser persistir (e portanto
carregá-los também em runtime), defina `Persist := True`.

---

## 3. TXDataWebClient

Comunica com o servidor após a conexão estar estabelecida — o client **não**
conecta sozinho.

Faz o que o `TXDataClient` faz (GET, POST, PUT, DELETE, service operations), mas
sempre assíncrono.

```delphi
procedure TForm1.GetArtistWithId1;
begin
  XDataWebClient1.Connection := XDataWebConnection1;
  XDataWebClient1.OnLoad := XDataWebClient1Load;
  XDataWebClient1.Get('Artist', 1);
end;

procedure TForm1.XDataWebClient1Load(Response: TXDataClientResponse);
var
  Artist: TJSObject;
begin
  Artist := TJSObject(Response.Result);   // equivalente a:
  Artist := Response.ResultAsObject;
end;
```

`Response.Result` é do tipo `JSValue`, e você interpreta conforme a requisição:
`TJSObject` para uma entidade, `TJSArray` para uma lista. Há também
`ResultAsObject` e `ResultAsArray`.

O componente é muito leve — a forma mais RAD é soltar **um `TXDataWebClient` por
requisição**, cada um com seu `OnLoad`. Se preferir um só para várias requisições,
diferencie pelo request id.

### Versão async/await

Mesmos métodos com sufixo `Async`:

```delphi
procedure TForm1.GetArtistWithId1;
var
  Response: TXDataClientResponse;
  Artist: TJSObject;
begin
  XDataWebClient1.Connection := XDataWebConnection1;
  Response := await(XDataWebClient1.GetAsync('Artist', 1));
  Artist := Response.ResultAsObject;
end;
```

### RequestId

Por padrão o request id é o nome da operação em minúsculas: `get`, `list`, etc.

```delphi
procedure TForm1.XDataWebClient1Load(Response: TXDataClientResponse);
begin
  if Response.RequestId = 'get' then
    Artist := TJSObject(Response.Result);
end;
```

Para customizar, passe-o como parâmetro extra:

```delphi
XDataWebClient1.Get('Artist', 1, 'get artist');
```

### Tratamento de erros

Sem configuração, os erros disparam o `OnError` do **`TXDataWebConnection`** — um
ponto central para todos os erros daquele servidor. Para tratamento específico, use
o `OnError` do próprio client:

```delphi
procedure TForm1.XDataWebClient1Error(Error: TXDataClientError);
begin
  WriteLn('Error on request: ' + Error.ErrorMessage);
end;
```

Com os métodos `Async`, basta `try..except`:

```delphi
try
  Response := await(XDataWebClient1.GetAsync('Artist', 1));
except
  on E: Exception do ; // trata E
end;
```

### Callbacks

Alternativa aos eventos: passe callback de sucesso e, opcionalmente, de erro (sem
ele, cai no `OnError`).

```delphi
procedure TForm1.GetArtistWithId1;

  procedure OnSuccess(Response: TXDataClientResponse);
  var
    Artist: TJSObject;
  begin
    Artist := TJSObject(Response.Result);
  end;

  procedure OnError(Error: TXDataClientError);
  begin
    WriteLn('Error on request: ' + Error.ErrorMessage);
  end;

begin
  XDataWebClient1.Get('Artist', 1, @OnSuccess, @OnError);
end;
```

### Métodos disponíveis

As assinaturas abaixo mostram só os parâmetros obrigatórios; todas aceitam também
`RequestId` e/ou callbacks, e todas têm versão `Async`.

| Método | Descrição |
|---|---|
| `Get(const EntitySet: string; Id: JSValue)` | entidade única. Resultado: `TJSObject`. |
| `Get(const EntitySet, QueryString: string; Id: JSValue)` | idem, com query options (tipicamente `$expand`). |
| `List(const EntitySet: string; const Query: string = '')` | coleção; `Query` aceita `$filter`, `$orderby` etc. Resultado: `TJSArray`. |
| `Post(const EntitySet: string; Entity: TJSObject)` | insere. |
| `Put(const EntitySet: string; Entity: TJSObject)` | atualiza; o id vem dentro do próprio `Entity`. |
| `Delete(const EntitySet: string; Entity: TJSObject)` | remove; só as propriedades de id importam. |
| `RawInvoke(const OperationId: string; Args: array of JSValue)` | invoca service operation. |

### Invocando service operations

Como as interfaces de contrato ainda não podem ser usadas no Web Core, a invocação
é por `RawInvoke`. O `OperationId` é, por padrão, **nome da interface + ponto +
nome do método** — note que aqui o `I` **não** é removido:

```delphi
XDataWebClient1.RawInvoke('IMyService.Hello', []);
```

Com resultado:

```delphi
procedure TForm2.WebButton1Click(Sender: TObject);

  procedure OnResult(Response: TXDataClientResponse);
  var
    GreetResult: string;
  begin
    GreetResult := string(TJSObject(Response.Result)['value']);
  end;

begin
  Client.RawInvoke('IMyService.Greet', ['My name'], @OnResult);
end;
```

O `['value']` é necessário porque o XData envolve o retorno escalar num objeto com
o par `"value"` — vale a pena conhecer o formato JSON (`json-format.md`) ao
trabalhar aqui, já que não há marshalling tipado.

Parâmetros vão num array de `JSValue`, incluindo `TJSObject` e `TJSArray`.

Versão async:

```delphi
Response := await(Client.RawInvokeAsync('IMyService.Greet', ['My name']));
GreetResult := string(TJSObject(Response.Result)['value']);
```

### ReferenceSolvingMode

```delphi
property ReferenceSolvingMode: TReferenceSolvingMode
```
- `rsAll` (padrão) — substitui todas as ocorrências de `$ref` pela instância
  referida, deixando o trabalho com objetos parecido com o do `TXDataClient`
  desktop. Tem um pequeno custo de processamento.
- `rsNone` — deixa os `$ref` como estão.

---

## 4. TXDataWebDataset

Abstração ainda mais alta: você trabalha como num dataset Delphi tradicional e o
framework traduz para requisições REST/JSON.

Configuração:

```delphi
XDataWebDataset1.Connection := XDataWebConnection1;   // conexão já estabelecida
XDataWebDataset1.EntitySetName := 'artist';
```

Opcionalmente defina os fields persistentes em design-time — o editor de fields
busca os campos disponíveis nos metadados do servidor. Sem isso, os fields default
são criados na abertura.

### Carregando automaticamente

```delphi
XDataWebDataset1.Load;
```

Use `Load`, **não** `Open`: `Load` dispara a requisição e, quando ela termina,
alimenta o dataset e só então chama `Open`, disparando `AfterOpen`. É no
`AfterOpen` que os dados estão disponíveis.

> Se já houver dados e você quiser substituí-los completamente, **feche o dataset
> antes** de chamar `Load`.

Filtragem no servidor via `QueryString`:

```delphi
XDataWebDataset1.QueryString := '$filter=startswith(Name, ''John'')&$top=50';
XDataWebDataSet1.Load;
```

### Paginação

Além de escrever `$top`/`$skip` na query string, há propriedades dedicadas:

```delphi
XDataWebDataset1.QueryTop := 50;    // tamanho da página
XDataWebDataset1.QuerySkip := 100;  // pula 2 páginas
XDataWebDataset1.QueryString := '$filter=startswith(Name, ''John'')';
XDataWebDataSet1.Load;
```

Total de registros no servidor (independente da página) — desligado por padrão
porque exige processamento extra no servidor:

```delphi
XDataWebDataset1.ServerRecordCountMode := smInlineCount;
```

```delphi
procedure TForm4.XDataWebDataSet1AfterOpen(DataSet: TDataSet);
begin
  TotalRecords := XDataWebDataset1.ServerRecordCount;
end;
```

### Carregando manualmente

Se você já buscou os dados por conta própria (com `TXDataWebClient` ou HTTP cru),
alimente o dataset e chame `Open` normalmente — a parte assíncrona já foi resolvida:

```delphi
procedure TForm1.LoadWithXDataClient;

  procedure OnSuccess(Response: TXDataClientResponse);
  begin
    XDataWebDataset1.SetJsonData(Response.Result);
    XDataWebDataset1.Open;
  end;

begin
  XDataWebClient1.List('artist', '$filter=startswith(Name, ''New'')', @OnSuccess);
end;
```

### Modificando dados

Insert/Append/Edit/Delete/Post alteram **só a memória do cliente** — os objetos são
modificados, removidos ou criados localmente. Para enviar tudo ao servidor:

```delphi
XDataWebDataset1.ApplyUpdates;
```

Isso pega todas as modificações em cache e faz as requisições correspondentes ao
entity set. Há também `ApplyUpdatesAsync` e `LoadAsync` (5.20+) para o padrão
async/await, `GetPendingUpdates` e `ClearPendingUpdates` (5.21+) para inspecionar e
descartar o cache.

### Outras propriedades

| Propriedade | Descrição |
|---|---|
| `SubPropsDepth: Integer` | Carrega campos de subpropriedades. Com valor 1, uma associação `Customer` gera também os fields `Customer.Name`, `Customer.Birthday`, etc. Padrão 0. |
| `CurrentData: JSValue` | Valor associado à linha corrente (na prática, sempre um `TJSObject`). |
| `EnumAsIntegers: Boolean` | Compatibilidade retroativa. `True` cria `TIntegerField` para enumerados; o padrão `False` cria `TStringField`, coerente com o JSON do XData, que usa strings para enumerados. |
| `Indexes` | Publicada desde a 5.23, aparece no object inspector. |

---

## 5. Resolvendo erros comuns

**Antes de qualquer coisa, abra o console do browser** (F12 no Chrome e no
Firefox). Ele mostra o erro real, a call stack e as requisições HTTP feitas. Muitas
falhas em Web Core não exibem mensagem visível — a aplicação simplesmente não abre
ou se comporta de forma estranha.

Erro típico:

```
XDataConnectionError: Error connecting to XData server | fMessage::XDataConnectionError:
Error connecting to XData server fHelpContext::0
```

Duas causas dominam.

### CORS

O console mostra erro de CORS quando os arquivos da aplicação web vêm de um host
(ex.: `localhost:8000`) e a API está em outro (ex.: `localhost:2001`).

Soluções:
1. colocar os dois no mesmo host — rodar a app web em `localhost:2001`, ou mudar a
   URL do servidor XData para `localhost:8000/tms/xdata`;
2. adicionar middleware de CORS ao servidor XData (ou configurar
   `AccessControlAllowOrigin`).

### Mistura HTTPS/HTTP

Comum ao publicar a aplicação num servidor com SSL enquanto o XData continua em
HTTP: o browser bloqueia requisições HTTP a partir de página HTTPS.

Soluções:
1. usar HTTPS também no servidor XData (associar um certificado SSL; Let's Encrypt
   funciona) — a opção correta;
2. voltar a aplicação web para HTTP, o que não é recomendado em produção.

---

## 6. Wizard de aplicação web

`File > New > Other > Delphi Projects > TMS Business > TMS XData Web Application`.

O wizard gera uma aplicação TMS Web Core responsiva, baseada em Bootstrap, com
páginas de listagem (filtro, ordenação e paginação) para as entidades escolhidas.

Passos:
1. Informe a URL de um servidor XData **em execução**. "Test Connection" verifica a
   conexão; "Set Request Headers..." permite adicionar headers (por exemplo, um JWT
   no header Authorization) caso o servidor exija autenticação.
2. Escolha, na lista de entidades publicadas, quais terão página de listagem. As
   não selecionadas não aparecem no menu nem ganham página.
3. Escolha a pasta de saída. O código é gerado e o projeto abre no Delphi.

A partir daí é um projeto normal: compile, execute e modifique como quiser.
