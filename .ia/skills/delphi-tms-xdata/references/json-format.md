# Formato JSON do XData

Índice:
1. Representação de entidades e objetos
2. Valores de propriedades
3. Referências de objeto ($id / $ref)
4. Anotação @xdata.type
5. Representação de objetos associados
6. Blobs
7. Incluindo e excluindo propriedades
8. Customizando a serialização (converters)
9. Coleções, propriedades individuais, erros
10. Canonical id

---

## 1. Representação de entidades e objetos

Toda entidade Aurelius ou objeto Delphi vira um objeto JSON, com um par
nome/valor por propriedade.

- **Objeto Delphi comum (PODO):** os nomes vêm dos **campos**, sem o `F` inicial.
- **Entidade Aurelius:** os nomes vêm das propriedades definidas no XData Model
  (ver `crud-endpoints.md`, seção 1).

Um PODO sempre traz todas as propriedades, a menos que você mude isso com os
atributos da seção 7. Uma entidade pode vir completa ou parcial (em atualizações
parciais).

```json
{
  "$id": 1,
  "Id": 55,
  "Name": "Joseph",
  "Birthday": "1980-05-20",
  "Sex": "tsMale",
  "Picture": null
}
```

`$id` e `@xdata.type` são metadados do XData, não propriedades da classe.

---

## 2. Valores de propriedades

| Tipo | Exemplos | Formato |
|---|---|---|
| null | `null` | literal JSON null |
| Binário | `"T0RhdGE"` | string JSON com o valor em Base64 |
| Boolean | `true`, `false` | literais JSON |
| DateTime | `"2013-12-25"`, `"2013-12-25T12:12"`, `"2013-12-25T12:12:20.050"` | string ISO 8601 (`YYYY-MM-DDTdd:mm:ss.zzz`). A parte de tempo pode ser omitida por inteiro; se presente, hora e minuto são obrigatórios, segundos e milissegundos opcionais |
| Enumerado | `"tsMale"`, `"Yellow"` | string com o **nome** do valor |
| Float | `3.14`, `1.2e-5` | número JSON |
| Guid | `"E314E4B3-ECE5-4BD5-9D41-65B7E74F7CC8"` | string sem chaves, com hífens separando os blocos 8-4-4-4-12 |
| Integer | `1234` | número JSON |
| String | `"John"` | string JSON com escaping padrão |

---

## 3. Referências de objeto ($id / $ref)

Serve para indicar que dois pontos do JSON apontam para a **mesma instância** e
para evitar referências circulares infinitas.

Ao serializar, o XData atribui um "instance id" ao objeto e o emite como
**primeira** propriedade, com o nome `$id`. Se a mesma instância reaparecer, em
vez de serializá-la de novo ele emite `{"$ref": <id>}`.

```json
[
  {
    "$id": 1,
    "@xdata.type": "XData.Default.Product",
    "Id": 10, "Name": "Ball",
    "Category": { "$id": 2, "@xdata.type": "XData.Default.Category", "Id": 5, "Name": "Toys" }
  },
  {
    "$id": 2,
    "@xdata.type": "XData.Default.Product",
    "Id": 12, "Name": "Doll",
    "Category": { "$ref": 2 }
  }
]
```

Na desserialização, ao encontrar `$ref` o `TXDataClient` procura a instância com
aquele `$id` e reusa o **mesmo objeto** — os dois `Product` acima apontam para o
mesmo `Category`. Se não encontrar, levanta erro. Todas as outras propriedades de
um objeto que contenha `$ref` são ignoradas.

`$id` é sempre emitido pelo serializador, mas **não é obrigatório** na
desserialização. Se presente, tem que ser o primeiro par do objeto.

O comportamento é controlado por `TXDataServerModule.SerializeInstanceRef`:
- `Always` (padrão) — `$ref` sempre que a instância reaparece. Melhor com `TXDataClient`.
- `IfRecursive` — `$ref` só em recursão; nos demais casos o objeto é repetido
  inline. Melhor para clientes JavaScript, que não têm resolvedor de referências.

---

## 4. Anotação @xdata.type

Indica o entity type do objeto JSON, para o desserializador saber qual classe
instanciar. Valor: nome da classe/entity type prefixado por `XData.Default.`.

```json
{ "$id": 1, "@xdata.type": "XData.Default.Customer", "Id": 55, "Name": "Joseph" }
```

Regras:
- Se presente, tem que aparecer **antes** de qualquer propriedade normal, senão
  dá erro na desserialização.
- **Ao enviar requisições é opcional** — o XData infere o tipo pelo contexto (se a
  service operation espera `TCustomer`, o JSON vira `TCustomer`). Só é realmente
  necessário para polimorfismo.
- **Em atualizações (PUT/PATCH), incluí-la força verificação de tipo** e gera erro
  se não bater com o recurso do servidor.
- Nas respostas, a presença depende de
  `TXDataServerModule.SerializeInstanceType`: `Always` (padrão) ou `IfNeeded`
  (só quando o tipo é descendente do esperado).

---

## 5. Representação de objetos associados

Distinção importante:
- **objeto associado** = propriedade que aponta para um objeto Delphi qualquer;
- **entidade associada** = propriedade que aponta para uma entidade Aurelius via
  navigation property (associação).

Para objetos associados (não-entidades), **só existe a forma inline**. As três
formas abaixo valem só para entidades associadas.

### a) Entity reference — forma preferida

Anota-se o nome da navigation property com o sufixo `@xdata.ref`; o valor é o
canonical id do objeto associado:

```json
"Country@xdata.ref": "Country(10)"
```

Vantagens: o cliente sabe o tipo e o id sem fazer requisição, e pode usar o valor
como URL relativa para buscar o objeto. Em insert/update, **é esta forma que
atualiza a associação**.

### b) Inline

```json
{
  "Country": {
    "$id": 2,
    "@xdata.type": "XData.Default.Country",
    "Id": 10,
    "Name": "Germany"
  }
}
```

Usado por clientes que precisam enviar associadas ainda **sem id** (que portanto
não podem ser referenciadas), ou devolvido pelo servidor quando o expand level
aumenta ou quando se pede `$expand`.

Referência de objeto e referência de entidade são coisas diferentes e podem se
combinar — uma entidade inline pode ser substituída por `$ref` se aquela instância
já apareceu antes na árvore:

```json
{ "Country": { "$ref": 2 } }
```

### c) Proxy info

Por desempenho, o servidor pode devolver a associação como proxy, com o sufixo
`@xdata.proxy` e uma URL relativa:

```json
"Country@xdata.proxy": "$proxy?id=52&classname='Customer'&classmember='Country'"
```

Duas diferenças em relação à entity reference:
1. o canonical id tem formato definido (dá para extrair tipo e id sem requisição);
   a URL de proxy é opaca;
2. em insert/update, proxies são **completamente ignorados** pelo servidor e não
   alteram a navigation property.

Respostas do servidor costumam usar referências; o header `xdata-expand-level`
altera isso. O `TXDataClient` define automaticamente expand level 3 — por isso
objetos costumam vir mais preenchidos nele.

---

## 6. Blobs

Valores binários em geral viram base64:

```json
"Data": "T0RhdGE"
```

Quando a propriedade é do tipo Aurelius `TBlob`, o padrão é o proxy, que permite
carregamento lazy:

```json
"Data@xdata.proxy": "Customer(55)/Data"
```

`TBlob` sempre vem assim, **exceto**:

1. objeto transiente (sem id) — o conteúdo vai inline em base64;
2. conteúdo disponível e vazio — serializa normal, com `"Data": null`;
3. `$expand` usado na propriedade — conteúdo inline em base64.

---

## 7. Incluindo e excluindo propriedades

Padrão:
- **entidades:** todo membro mapeado no Aurelius é serializado; `[Transient]` não é;
- **objetos (PODO):** todos os **campos** são serializados; nenhuma **propriedade** é.

### Entidades: XDataProperty e XDataExcludeProperty

Unit `XData.Model.Attributes`. Sem argumentos: incluem ou removem o membro do JSON.

```delphi
uses XData.Model.Attributes;

[Entity, Automapping]
TCustomer = class
private
  FId: Integer;
  FName: string;
  [XDataExcludeProperty]
  FBirthday: TDateTime;
  function GetDay: Integer;
  function GetMonth: Integer;
  function GetYear: Integer;
  procedure SetDay(const Value: Integer);
  procedure SetMonth(const Value: Integer);
  procedure SetYear(const Value: Integer);
public
  property Id: Integer read FId write FId;
  property Name: string read FName write FName;
  property Birthday: TDateTime read FBirthday write FBirthday;
  [XDataProperty] property Year: Integer read GetYear write SetYear;
  [XDataProperty] property Month: Integer read GetMonth write SetMonth;
  [XDataProperty] property Day: Integer read GetDay write SetDay;
end;
```
JSON resultante: `Id`, `Name`, `Year`, `Month`, `Day` — `Birthday` continua sendo o
campo persistido, mas não aparece.

### PODO: JsonProperty e JsonIgnore

Unit `Bcl.Json.Attributes`. `JsonProperty` aceita opcionalmente o nome final no JSON.

```delphi
uses Bcl.Json.Attributes;

TDTOPerson = class
private
  FId: Integer;
  [JsonProperty('PersonName')]
  FName: string;
  FBirthday: TDateTime;
  [JsonIgnore]
  FTransient: string;
public
  property Id: Integer read FId write FId;
  property Name: string read FName write FName;
  [JsonProperty]
  property YearOfBirth: Integer read GetYearOfBirth;
  property Birthday: TDateTime read FBirthday write FBirthday;
  property Transient: string read FTransient write FTransient;
end;
```
JSON: `Id`, `PersonName`, `Birthday`, `YearOfBirth`.

### JsonInclude

Aplicado à **classe**, controla a serialização por valor:

```delphi
[JsonInclude(TInclusionMode.NonDefault)]
TDTOAddress = class
```

- `TInclusionMode.Always` — sempre serializa tudo (padrão).
- `TInclusionMode.NonDefault` — só serializa se o valor não for o default:
  objeto = nil; string = vazia; numérico = zero; enumerado = primeiro valor
  (ordinal zero); conjunto = vazio; array = vazio.

### JsonEnumValues

Aplicado ao **tipo enumerado**, troca os nomes emitidos:

```delphi
type
  [JsonEnumValues('first,second,third')]
  TMyEnum = (myFirst, mySecond, myThird);
```
→ `"MyEnumProp": "first"` em vez de `"myFirst"`.

### JsonNamingStrategy

Aplicado à classe, define uma regra geral de nomes (unit
`Bcl.Json.NamingStrategies`). Exemplos considerando `FFirstName: string;` e
`property LastName: string;`:

| Estratégia | Resultado |
|---|---|
| `TDefaultNamingStrategy` (padrão) | `{"FirstName": "Joe", "LastName": "Smith"}` |
| `TCamelCaseNamingStrategy` | `{"firstName": "Joe", "lastName": "Smith"}` |
| `TSnakeCaseNamingStrategy` | `{"first_name": "Joe", "last_name": "Smith"}` |
| `TIdentityNamingStrategy` | `{"FFirstName": "Joe", "LastName": "Smith"}` |
| `TIdentityCamelCaseNamingStrategy` | `{"fFirstName": "Joe", "lastName": "Smith"}` |
| `TIdentitySnakeCaseNamingStrategy` | `{"ffirst_name": "Joe", "last_name": "Smith"}` |

As variantes "Identity" **não** removem o `F` inicial dos campos.

```delphi
[JsonNamingStrategy(TCamelCaseNamingStrategy)]
TMySimpleClass = class
```

---

## 8. Customizando a serialização (converters)

Herde de `TCustomJsonConverter` e sobrescreva `ReadJson` e `WriteJson`.

```delphi
uses Bcl.Json.Converters, Bcl.Json.Reader, Bcl.Json.Writer, System.Rtti;

type
  TSampleJsonConverter = class(TCustomJsonConverter)
  protected
    procedure ReadJson(const Reader: TJsonReader; var Value: TValue); override;
    procedure WriteJson(const Writer: TJsonWriter; const Value: TValue); override;
  end;

procedure TSampleJsonConverter.ReadJson(const Reader: TJsonReader; var Value: TValue);
var
  S: string;
begin
  S := Reader.ReadString;
  if SameText(S, 'one') then Value := 1
  else if SameText(S, 'two') then Value := 2
  else Value := StrToInt(S);
end;

procedure TSampleJsonConverter.WriteJson(const Writer: TJsonWriter; const Value: TValue);
begin
  case Value.AsOrdinal of
    1: Writer.WriteString('one');
    2: Writer.WriteString('two');
  else
    Writer.WriteString(IntToStr(Value.AsOrdinal));
  end;
end;
```

Aplicando com `JsonConverter` (unit `Bcl.Json.Attributes`):

```delphi
TFoo = class
private
  [JsonConverter(TSampleJsonConverter)]
  FProp: Integer;
```

`FProp = 1` → `"FProp": "one"`; `= 2` → `"two"`; outros valores → número normal.
O converter também trata a desserialização (lendo `"one"` grava 1).

---

## 9. Coleções, propriedades individuais, erros

### Coleção de objetos

Array JSON, cada elemento sendo a representação de uma entidade, de uma
referência, ou de qualquer tipo suportado. Coleção vazia = array vazio.

```json
[
  { "$id": 1, "@xdata.type": "XData.Default.Country", "Id": 10, "Name": "Germany" },
  { "$id": 2, "@xdata.type": "XData.Default.Country", "Id": 13, "Name": "USA" }
]
```

Quando a resposta é de um entity set, de uma navigation property que devolve
coleção, ou de uma service operation que devolve lista, o array vem **envolvido**
num objeto com o par `"value"`:

```json
{ "value": [ ... ] }
```

### Propriedade individual

```json
{ "value": "John Doe" }
```
Exceto com sufixo `$value` ou propriedade blob, onde o corpo é o valor bruto.

### Erro

Objeto único com o par `"error"`, contendo `code` e `message`:

```json
{
  "error": {
    "code": "EntityNotFound",
    "message": "Requested entity does not exist."
  }
}
```

Os valores de `code` e `message` podem ser alterados no evento `OnModuleException`
(ver `events-and-security.md`). Erros de validação de parâmetros trazem também um
array `errors` (ver `service-operations.md`).

---

## 10. Canonical id

String que identifica completamente uma entidade Aurelius. Formato:
`<entityset>(<id>)`, com o id em representação literal de URL.

```
"Invoice(5)"
"Customer('John')"
"InvoiceItem(15)"
```

O entity set tem que ser o do **tipo exato** da entidade. Com herança, um `Dog`
pode pertencer aos entity sets `Dog`, `Mammal` e `Animal` — o canonical id usa
`Dog`.

O canonical id também é a **URI relativa** da entidade: concatenado à base URL do
servidor, resulta na URL utilizável para GET/PUT/DELETE:

```
http://server:2001/tms/xdata/Invoice(5)
http://server:2001/tms/xdata/Customer('John')
http://server:2001/tms/xdata/InvoiceItem(15)
```

É esse formato que aparece nos valores de `@xdata.ref`.
