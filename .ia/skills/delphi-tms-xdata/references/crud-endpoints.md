# CRUD Endpoints automáticos (TMS Aurelius)

Este capítulo só se aplica se o projeto usar TMS Aurelius. XData funciona sem ele.

Índice:
1. Como as entidades viram endpoints
2. Permissões de entity set
3. Convenções de URL
4. Query options
5. Funções embutidas e customizadas
6. Literais em URI
7. Requisitando dados
8. Modificando dados
9. Headers de requisição

---

## 1. Como as entidades viram endpoints

Ao criar o `TXDataServerModule`, o modelo é construído automaticamente a partir do
mapeamento Aurelius (do `TMappingExplorer`). Regras:

- **Toda classe mapeada vira um entity type**, com o nome da classe sem o `T`.
- **Cada entity type ganha um entity set** de mesmo nome, contendo todas as
  instâncias daquele tipo **e de seus descendentes**.
- **Todo membro mapeado vira propriedade**: se for associação, vira navigation
  property; senão, simple property. Campos perdem o prefixo `F`. Membros
  `[Transient]` ficam de fora.

```delphi
[Entity, Automapping]
TCustomer = class
strict private
  FId: Integer;
  FName: string;
  [Transient] FSex: Nullable<TSex>;
  [Column('BIRTHDAY', [])] FBirthday: Nullable<TDate>;
  FCountry: TCountry;
  [Column('Description', [])] FDescription: TBlob;
  [Transient] FPhoto: TBlob;
  [Transient] FPhoto2: TBlob;
public
  property Id: Integer read FId write FId;
  property Name: string read FName write FName;
  [Column('SEX', [])] property Sex: Nullable<TSex> read FSex write FSex;
  property Birthday: Nullable<TDate> read FBirthday write FBirthday;
  property Country: TCountry read FCountry write FCountry;
  property Description: TBlob read FDescription write FDescription;
  [Column('Photo', [TColumnProp.Lazy])] property Photo: TBlob read FPhoto write FPhoto;
  property Photo2: TBlob read FPhoto2 write FPhoto2;
end;
```
Propriedades resultantes: `Id`, `Name`, `Birthday`, `Country` (navigation),
`Description`, `Sex`, `Photo`. `FSex`, `FPhoto` e `FPhoto2` saem do mapeamento por
serem `[Transient]`, mas `Sex` e `Photo` entram porque as **propriedades** foram
mapeadas explicitamente.

Endpoints resultantes:

```
GET http://server:2001/tms/xdata/Customer                lista clientes
GET http://server:2001/tms/xdata/Customer(1)             cliente id 1
GET http://server:2001/tms/xdata/Customer(2)/Country     país do cliente 2
GET http://server:2001/tms/xdata/Customer?$filter=Country/Name eq 'USA'&$orderby=Name&$top=10
```

Para mudar o nome do prefixo globalmente, use `TXDataModelBuilder`
(`UseOriginalClassNames`, `UseOriginalFieldNames`) — ver `server-setup.md`.

> **Linker:** entidades que só existem para serem publicadas são removidas pelo
> linker se não forem referenciadas. Chame `RegisterEntity(TCustomer)` em algum
> ponto do servidor.

---

## 2. Permissões de entity set

Por padrão, ao criar `TXDataServerModule` diretamente, **todos** os entity sets são
publicados com permissão total. (Com o componente `TXDataServer` o padrão é o
oposto: nenhuma permissão — ver `server-setup.md`.)

```delphi
procedure SetEntitySetPermissions(const EntitySetName: string;
  Permissions: TEntitySetPermissions);
```

`EntitySetName` é o nome do entity set (não necessariamente o da classe), ou `'*'`
para todos.

```delphi
// unit XData.Module.Base
TEntitySetPermission = (List, Get, Insert, Modify, Delete);
TEntitySetPermissions = set of TEntitySetPermission;

const
  EntitySetPermissionsAll   = [Low(TEntitySetPermission)..High(TEntitySetPermission)];
  EntitySetPermissionsRead  = [TEntitySetPermission.List, TEntitySetPermission.Get];
  EntitySetPermissionsWrite = [TEntitySetPermission.Insert, TEntitySetPermission.Modify,
                               TEntitySetPermission.Delete];
```

| Valor | Permite |
|---|---|
| `List` | consultar entidades do entity set usando critérios de query |
| `Get` | recuperar uma entidade única, suas subpropriedades e associadas |
| `Insert` | criar nova entidade |
| `Modify` | alterar entidade (PUT, PATCH, ou modificar propriedades/coleções) |
| `Delete` | remover entidade |

```delphi
// tudo menos apagar
Module.SetEntitySetPermissions('Country', EntitySetPermissionsAll - [TEntitySetPermission.Delete]);

// somente leitura
Module.SetEntitySetPermissions('City', EntitySetPermissionsRead);

// listar, obter e criar
Module.SetEntitySetPermissions('History',
  [TEntitySetPermission.List, TEntitySetPermission.Get, TEntitySetPermission.Insert]);

// padrão somente leitura para tudo (pode ser sobrescrito por entity set)
Module.SetEntitySetPermissions('*', EntitySetPermissionsRead);
```

Permissão é diferente de autorização: permissão diz o que o endpoint expõe;
autorização diz quem pode chamá-lo (ver `events-and-security.md`).

---

## 3. Convenções de URL

A URL tem três partes:

```
http://server:2001/tms/xdata/Customer?$top=2&$orderby=Name
\___________________________/\______/ \__________________/
          root URL       resource path     query options
```

Para service operations:

```
http://server:2001/tms/xdata/MathService/Multiply
\___________________________/\__________/\_______/
          root URL             service    operation
```

### Entity set

```
/Customer
/Customer?$orderby=Name
/Customer/$count
```

Para mudar o nome do path, use `[URIPath]` (unit `XData.Service.Common`) na classe:

```delphi
uses XData.Service.Common;

[URIPath('Customers')]
TCustomer = class
```
→ `/Customers`

### Entidade única

Chave entre parênteses:

```
/Customer(3)
/Employee('XYZ')
```

Chaves compostas (não recomendadas), nomeadas ou não — a ordem não importa quando
nomeadas:

```
/Person('Doe','John')
/Person(LastName='Doe',FirstName='John')
```

Aspas simples dentro de string são escapadas duplicando-as:
`/Entity('Text '' text', 9)`.

Com `EnableEntityKeyAsSegment = True` (no módulo ou no componente):

```
/Customer/3
/Employee/XYZ
/Person/Doe/John
```

No cliente Delphi, `TXDataClient.EntityKeyAsSegment` (5.27+) faz o cliente usar
esse formato.

### Navigation properties

```
/Customer(3)/Country          entidade associada
/Order(41)/OrderItems         coleção associada
```

**Máximo de um nível.** `/Order(41)/Customer/Country` é inválido — use
`/Customer(x)/Country` ou `/Country(<key>)` direto.

Em coleções associadas **não** é possível usar predicado de chave nem query
options (filtro, ordenação).

### Propriedades individuais

```
/Customer(3)/Name           JSON: { "value": "..." }
/Customer(3)/Name/$value    texto puro (text/plain)
```

### Streams (blobs)

```
/Customer(3)/Photo          conteúdo binário bruto, sem content-type
```
Blobs **não** usam o sufixo `$value` — a URL da propriedade já devolve o valor bruto.

### $count

```
/Customer/$count
/Customer/$count?$filter=Name eq 'John'
/Order(41)/OrderItems/$count
```
Retorna o número em `text/plain`.

### $model

```
/tms/xdata/$model
```
Metadados do modelo (entidades, operações, parâmetros). Usado por ferramentas
XData; formato sujeito a mudanças.

---

## 4. Query options

Começam com `?`, no formato `name=value`, separadas por `&`. **Só se aplicam a
entity sets**, não a navigation properties de coleção.

| Opção | Descrição |
|---|---|
| `$filter` | filtra as entidades por uma expressão booleana |
| `$orderby` | ordena por uma ou mais propriedades/expressões |
| `$top` | número máximo de entidades retornadas |
| `$skip` | número de entidades a pular |
| `$inlinecount` | inclui o total de entidades (ignorando paginação) na resposta |
| `$expand` | força associações/blobs a virem inline |
| `$select` | escolhe quais campos aparecem na resposta |

### $filter

```
/Customer?$filter=Name eq 'John'
/Customer?$filter=Country/Name eq 'USA'
/Customer?$filter=(Name eq 'John' or Name eq 'Jack') and Country/Name eq 'USA'
```

Barras acessam navigation properties. Literais seguem as regras da seção 6.

Operadores, da maior para a menor precedência (mesma categoria = mesma precedência):

| Categoria | Expressão | Descrição |
|---|---|---|
| Agrupamento | `(x)` | parênteses |
| Primário | `Name/SubName` | acesso a subpropriedade |
| Unário | `-x` | negação numérica |
| Unário | `not x` | negação lógica |
| Multiplicativo | `x mul y` | multiplicação |
| Multiplicativo | `x div y` | divisão |
| Aditivo | `x add y` | soma |
| Aditivo | `x sub y` | subtração |
| Relacional | `x lt y` | menor que |
| Relacional | `x gt y` | maior que |
| Relacional | `x le y` | menor ou igual |
| Relacional | `x ge y` | maior ou igual |
| Igualdade | `x eq y` | igual |
| Igualdade | `x ne y` | diferente |
| AND | `x and y` | e |
| OR | `x or y` | ou |

### $orderby

```
$orderby=<expressão> [asc/desc]
$orderby=<expr> [asc/desc],<expr> [asc/desc],...
```

```
/Customer?$orderby=Name
/Invoice?$orderby=Customer/Country/Name desc
/Customer?$orderby=LastName,FirstName
```
Sem `asc`/`desc`, assume ascendente.

### $top e $skip

```
/Order?$orderby=Date&$top=10
/Order?$orderby=Date desc&$skip=10
```
Use sempre junto com `$orderby`, senão a "primeira" página não é determinística.

### $inlinecount

```
$inlinecount=none|allpages
```
`none` é o padrão. Com `allpages`, o total (ignorando `$top`/`$skip`) vem na
propriedade `@xdata.count`:

```
/Order?$orderby=Date&$top=10&$inlinecount=allpages
```
```json
{
  "@xdata.count": 142,
  "value": [ ... ]
}
```

### $expand

Por padrão, associações vêm como referência (`"Country@xdata.ref": "Country(10)"`).
`$expand` traz o objeto inline:

```
/Customer(3)?$expand=Country
```
```json
{
  "$id": 1,
  "@xdata.type": "XData.Default.Customer",
  "Id": 3,
  "Name": "Bill",
  "Country": { "$id": 2, "@xdata.type": "XData.Default.Country", "Id": 10, "Name": "Germany" }
}
```

Vale para associação simples e para listas, e **força proxies lazy a carregarem**.
O XData otimiza isso carregando o proxy eagerly num único SQL (exceto para listas).

Também expande blobs, que por padrão vêm como proxy
(`"Data@xdata.proxy": "Customer(55)/Data"`):

```
/Invoice(3)?$expand=Data     →  "Data": "T0RhdGE"   (base64 inline)
```

Múltiplas propriedades por vírgula, subníveis por barra:

```
/Invoice(10)?$expand=Customer,Seller,Products
/Invoice(10)?$expand=Customer/Country,Seller
```

### $select

Escolhe os campos da resposta. Além de economizar banda, **otimiza o SQL**, que
deixa de trazer as colunas ausentes.

```
/Customer(3)?$select=Id,FirstName,Birthday
```
```json
{ "Id": 3, "FirstName": "Bill", "Birthday": "1980-01-01" }
```

Com associações e subpropriedades:

```
/Customer(3)?$select=Id,FirstName,Birthday,Country,Country/Name&$expand=Country
```
```json
{
  "Id": 3, "FirstName": "Bill", "Birthday": "1980-01-01",
  "Country": { "Name": "USA" }
}
```

---

## 5. Funções embutidas e customizadas

Disponíveis em `$filter` e `$orderby`.

| Função | Descrição | Exemplo |
|---|---|---|
| `upper(s)` | maiúsculas | `$filter=upper(Name) eq 'PAUL'` |
| `lower(s)` | minúsculas | `$filter=lower(Name) eq 'paul'` |
| `length(s)` | nº de caracteres | `$filter=length(Name) eq 15` |
| `substring(s, N, M)` | M caracteres a partir do N-ésimo; **N é base 1** | `$filter=substring(CompanyName, 2, 4) eq 'oogl'` |
| `position(sub, s)` | posição (base 1) da 1ª ocorrência; 0 se não achar | `$filter=position('jr', Name) gt 0` |
| `concat(a, b)` | concatenação de dois valores | `$filter=concat(concat(Name, ' '), LastName) eq 'PAUL SMITH'` |
| `contains(s, sub)` | contém | `$filter=contains(Name, 'Walker')` |
| `startswith(s, sub)` | começa com | `$filter=startswith(Name, 'Paul')` |
| `endswith(s, sub)` | termina com | `$filter=endswith(Name, 'Smith')` |
| `year(d)` | ano | `$filter=year(BirthDate) eq 1971` |
| `month(d)` | mês | `$filter=month(BirthDate) eq 12` |
| `day(d)` | dia | `$filter=day(BirthDate) eq 31` |
| `hour(d)` | hora | `$filter=hour(BirthDate) eq 14` |
| `minute(d)` | minuto | `$filter=minute(BirthDate) eq 45` |
| `second(d)` | segundo | `$filter=second(BirthDate) eq 30` |

### Funções customizadas

Registre no parser do XData; a função também precisa estar registrada como "SQL
function" no LINQ do Aurelius para a query funcionar de fato.

```delphi
uses XData.Query.Parser;

TQueryParser.AddMethod('unaccent', TQueryMethod.Create('unaccent', 1));
```
O número indica a quantidade de parâmetros.

```
/Customer?$filter=unaccent(Name) eq 'Andre'
```

---

## 6. Literais em URI

| Tipo | Exemplos | Regras |
|---|---|---|
| null | `null` | literal |
| Boolean | `true`, `false` | literais |
| DateTime | `2013-12-25`, `2013-12-25T12:12`, `2013-12-25T12:12:20.125` | ISO 8601 (`YYYY-MM-DDTdd:mm:ss.zzz`); partes de tempo podem ser omitidas. Desde 5.21, literais de data aceitam parte de tempo zerada, para compatibilidade com JS |
| Float | `3.14`, `1.2e-5` | notação exponencial permitida |
| Guid | `E314E4B3-ECE5-4BD5-9D41-65B7E74F7CC8` | sem chaves, com os hífens separando os cinco blocos (8-4-4-4-12), dígitos hexadecimais |
| Integer | `1234` | — |
| String | `'John'` | entre aspas simples; aspa simples interna é duplicada |
| Enumerado | `csActive`, `TCustomerStatus.csActive` | pelo nome, sem aspas; prefixe com o tipo para desambiguar |

---

## 7. Requisitando dados

Tudo via GET, seguindo as convenções de URL.

### Coleções

```http
GET http://server:2001/tms/xdata/Country HTTP/1.1
GET http://server:2001/tms/xdata/Customer?$filter=Country/Name eq 'USA'&$orderby=Name&$top=10
GET http://server:2001/tms/xdata/Order(10)/Items
```
Lembrete: query options só em entity sets.

### Entidades associadas

```http
GET /tms/xdata/Order(10)/Customer     entidade única
GET /tms/xdata/Order(10)/Items        coleção
```
Navigation property inexistente → **404**. Associação simples sem valor → **204**.

### Entidade única

```http
GET /tms/xdata/Customer(3) HTTP/1.1
Host: server:2001
```
```json
{
  "$id": 1,
  "@xdata.type": "XData.Default.Customer",
  "Id": 55,
  "Name": "Joseph",
  "Birthday": "1980-05-20",
  "Sex": "tsMale",
  "Picture": null
}
```
Chave inexistente → **404**.

### Propriedade individual

```http
GET /tms/xdata/Product(1)/Name
```
```json
{ "value": "Silver Hammer XYZ" }
```
Valor nulo → **204**. Propriedade inexistente → **404**.

Valor bruto:
```http
GET /tms/xdata/Product(1)/Name/$value
```
→ `Content-Type: text/plain`, corpo: `Silver Hammer XYZ`. Nulo → **204**.

### Streams (blobs)

```http
GET /tms/xdata/Customer(1)/Photo
```
Corpo = conteúdo binário, **sem content-type** — cabe ao cliente saber o que é.
Nulo ou vazio → **204**; sucesso → **200**; propriedade inexistente → **404**.

---

## 8. Modificando dados

### Criar (POST)

POST na URL da coleção (entity set ou navigation property de coleção), com a
representação JSON da entidade — completa ou parcial.

```http
POST /tms/xdata/Country HTTP/1.1
Host: server:2001

{ "@xdata.type": "XData.Default.Country", "Name": "Brazil" }
```

- Propriedades ausentes recebem o valor default. Se uma delas for obrigatória e
  não tiver default no banco, a requisição falha.
- Propriedades que não existem no entity type não devem ser enviadas.
- `@xdata.type` é **opcional**; serve para polimorfismo — permite criar um tipo
  derivado postando na URL do tipo base:

```http
POST /tms/xdata/Animal HTTP/1.1
{ "@xdata.type": "XData.Default.Cat", "Name": "Wilbur", "CatBreed": "Persian" }
```
  Se o tipo indicado não for o mesmo nem descendente do tipo do entity set, falha.

- **Entidades associadas não podem vir inline.** Use referência:

```http
POST /tms/xdata/City HTTP/1.1
{ "$id": 1, "Name": "Frankfurt", "Country@xdata.ref": "Country(2)" }
```

- Valores de proxy podem estar presentes no payload (por exemplo, se você devolve
  um JSON que recebeu do servidor), mas são **ignorados** e não modificam a
  navigation property.
- POST numa navigation property de coleção (`Order(1)/Items`) associa
  automaticamente a nova entidade àquela coleção.

Resposta: **201 Created**, corpo com a representação da entidade criada, header
`Location` com a URL dela. A entidade retornada pode diferir da enviada (valores
gerados pelo servidor ou pelo banco).

### Atualizar (PATCH ou PUT)

**Prefira PATCH.** Ele faz merge: só as propriedades presentes no payload são
alteradas; as ausentes ficam intactas.

```http
PATCH /tms/xdata/Dog(1) HTTP/1.1
{ "@xdata.type": "XData.Default.Dog", "Id": 1, "Name": "Willy", "DogBreed": "Yorkshire" }
```

**PUT substitui**: propriedades ausentes voltam ao default (strings vazias,
associações nil...). Se uma delas for obrigatória, pode dar erro. Risco real de
perda de dados.

- Chave e propriedades não atualizáveis podem ser omitidas; se enviadas, são
  ignoradas na atualização.
- Associações só por referência, nunca inline:

```http
PATCH /tms/xdata/City(1) HTTP/1.1
{ "$id": 1, "@xdata.type": "XData.Default.City", "Country@xdata.ref": "Country(2)" }
```

- `@xdata.type` é opcional aqui, e **incluí-lo força uma verificação de tipo**: se
  não bater com o recurso no servidor, dá erro. Só inclua se tiver certeza.
- O comportamento do PUT no servidor depende de `PutMode`
  (`TXDataPutMode.Update` ou `Merge`, padrão), sobrescrevível pelo header
  `xdata-put-mode`.

Resposta: sucesso com o JSON da entidade atualizada.

### Apagar (DELETE)

```http
DELETE /tms/xdata/Dog(1) HTTP/1.1
Host: server:2001
```
Corpo vazio. Resposta **204 No Content**.

Cascatas configuradas no Aurelius podem remover associadas. Se houver restrição
de integridade impedindo, o servidor devolve erro sem remover.

### Blobs

PUT ou PATCH na URL da propriedade stream, com o conteúdo binário no corpo
(comportamento idêntico entre os dois métodos). Content-type é ignorado.

```http
PUT /tms/xdata/Customer(1)/Photo HTTP/1.1
<conteúdo binário>
```

DELETE limpa o conteúdo:

```http
DELETE /tms/xdata/Customer(1)/Photo HTTP/1.1
```

Ambos respondem **204 No Content**.

---

## 9. Headers de requisição

| Header | Efeito |
|---|---|
| `xdata-expand-level: 3` | profundidade máxima em que associadas são serializadas inline. Ausente = 0, ou seja, todas as associadas diretas viram referências. Quanto maior, maior o payload, mas menos requisições extras. **Proxies não são afetados.** |
| `xdata-put-mode: update` | sobrescreve `TXDataServerModule.PutMode` na requisição. Valores: `update`, `merge` |
| `xdata-serialize-instance-ref: ifrecursive` | sobrescreve `SerializeInstanceRef`. Valores: `always`, `ifrecursive` |
| `xdata-serialize-instance-type: ifneeded` | sobrescreve `SerializeInstanceType`. Valores: `always`, `ifneeded` |

O `TXDataClient` define `xdata-expand-level: 3` automaticamente — por isso
objetos costumam vir mais "cheios" no cliente Delphi do que numa chamada HTTP crua.
