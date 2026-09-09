# OpenAPI / Swagger

O XData gera automaticamente o documento OpenAPI (OAS, antigo Swagger) descrevendo
toda a API — service operations e CRUD endpoints. Isso destrava o ecossistema
OpenAPI: Swagger UI (documentação interativa e teste), Redoc (documentação
estática) e OpenAPI Generator (geração de clientes em várias linguagens).

Índice:
1. Habilitando o documento
2. Swagger UI
3. Redoc
4. Customizando o documento
5. SwaggerOptions
6. Regras de validação automáticas
7. Documentação XML
8. Tags e tag groups
9. required e deprecated
10. Importador OpenAPI (deprecado)

---

## 1. Habilitando o documento

Com componente:

```delphi
XDataServer1.SwaggerOptions.Enabled := True;
```

Com `TXDataServerModule`, chame o registro em qualquer ponto da aplicação:

```delphi
uses XData.OpenAPI.Service;

RegisterOpenAPIService;
```

O arquivo fica disponível via GET em `/openapi/swagger.json`, relativo à raiz do
servidor:

```
GET http://server:2001/tms/xdata/openapi/swagger.json
```

---

## 2. Swagger UI

Interface web que documenta e permite testar a API.

```delphi
XDataServer1.SwaggerUIOptions.Enabled := True;
```

ou, com o módulo:

```delphi
uses XData.SwaggerUI.Service;

RegisterSwaggerUIService;
```

Disponível em `/swaggerui` relativo à base:

```
http://server:2001/tms/xdata/swaggerui
```

Configuração via `SwaggerUIOptions` (existe tanto em `TXDataServer` quanto em
`TXDataServerModule`):

| Propriedade | Descrição |
|---|---|
| `ShowFilter` | Boolean, padrão False. Exibe caixa de busca de operações. |
| `DocExpansion` | `TSwaggerUIExpansion = (List, None, Full)`. Nível de expansão inicial. Padrão `List`. |
| `TryOutEnabled` | Boolean, padrão False. Quando True, já entra em modo "try out" sem precisar clicar no botão. |
| `CustomParams` | Parâmetros extras para o objeto JavaScript do SwaggerUI. |

```delphi
XDataModule.SwaggerUIOptions.Filter := True;
XDataModule.SwaggerUIOptions.DocExpansion := TSwaggerUIExpansion.None;
```

---

## 3. Redoc

Gerador de documentação a partir da definição OpenAPI — mais orientado a leitura
do que a teste.

```delphi
XDataServer1.RedocOptions.Enabled := True;
```

ou:

```delphi
uses XData.Redoc.Service;

RegisterRedocService;
```

Disponível em `/redoc`:

```
http://server:2001/tms/xdata/redoc
```

Configuração por `RedocOptions.CustomParams`, aceitando qualquer parâmetro do
Redoc:

```delphi
XDataServer1.RedocOptions.CustomParams.Values['disable-search'] := 'true';
```

---

## 4. Customizando o documento

Título, versão e descrição vêm do model. A descrição aceita **Markdown**:

```delphi
XDataServer.Model.Title := 'Mathematics API';
XDataServer.Model.Version := '1.0';
XDataServer.Model.Description :=
  '### Overview'#13#10 +
  'This is an API for **mathematical** operations. '#13#10 +
  'Feel free to browse and execute several operations like *arithmetic* ' +
  'and *trigonometric* functions'#13#10#13#10 +
  '### More info'#13#10 +
  'Build with [TMS XData](https://www.tmssoftware.com/site/xdata.asp)';
```

### Excluindo métodos

`[SwaggerExclude]` no método do contrato:

```delphi
[ServiceContract]
[Route('arith')]
IArithmeticService = interface(IInvokable)
['{9E343ABD-D97C-4411-86BF-AD2E13BE71F3}']
  [HttpGet] function Add(A, B: Double): Double;
  [HttpGet] function Subtract(A, B: Double): Double;
  [SwaggerExclude]
  [HttpGet] function NotThisFunctionPlease: Integer;
end;
```
O método continua funcionando; apenas não aparece na documentação.

---

## 5. SwaggerOptions

Disponível em `TXDataServer` e `TXDataServerModule`.

```delphi
XDataModule.SwaggerOptions.AuthMode := TSwaggerAuthMode.Jwt;
```

`AuthMode`: `TSwaggerAuthMode.Jwt` ou `None`. Com `Jwt`, uma security definition
chamada `jwt`, exigindo header `Authorization`, é adicionada a todas as
requisições — é o que permite testar endpoints protegidos pelo Swagger UI.

Também dá para configurar por query string na própria URL do documento:

| Parâmetro | Descrição |
|---|---|
| `ExcludeEntities` | Boolean, padrão False. `True` omite os CRUD endpoints automáticos. Ex.: `/openapi/swagger.json?ExcludeEntities=True` |
| `ExcludeOperations` | Boolean, padrão False. `True` omite as service operations. Ex.: `/openapi/swagger.json?ExcludeOperations=True` |
| `AuthMode` | String: `none` ou `jwt`. Ex.: `/openapi/swagger.json?authmode=jwt` |

`SwaggerOptions.DefaultTagGroup` — ver seção 8.

---

## 6. Regras de validação automáticas

Atributos de validação nas classes (`Range`, `MinLength`, `MaxLength`, `Required`)
entram automaticamente no documento OpenAPI:

```delphi
[Entity, Automapping]
TTrack = class
strict private
  [Required, MaxLength(150)]
  FName: string;
  [Range(0, 4800000)]
  FMilliseconds: Nullable<Integer>;
```

```json
"MusicEntities.TTrack": {
  "properties": {
    "Name": { "type": "string", "maxLength": 150, "x-data-type": "String", "x-length": 255 },
    "Milliseconds": { "type": "integer", "maximum": 4800000, "minimum": 0, "x-data-type": "Int32" }
  }
}
```

Ou seja: validar de verdade (ver `service-operations.md`) e documentar são a mesma
declaração. As ferramentas OpenAPI usam essas restrições — o Redoc, por exemplo, as
exibe junto de cada propriedade.

---

## 7. Documentação XML

Comentários XML Documentation nas interfaces e métodos do contrato servem
simultaneamente ao Help Insight do Delphi e ao documento OpenAPI.

```delphi
/// <summary>
///   Retrieves the sine (sin) of an angle
/// </summary>
/// <remarks>
/// Returns the Sine (Sin) value of an angle radians value.
/// The value returned will be between -1 and 1.
/// </remarks>
/// <param name="Angle">
///   The angle in radians.
/// </param>
function Sin(Angle: Double): Double;
```

Mapeamento: `summary` → resumo do endpoint (ao lado do botão do método),
`remarks` → descrição detalhada, `param` → descrição de cada parâmetro.

### Habilitando os arquivos XML

O XData lê os arquivos `.xml` gerados pelo compilador — é preciso ligá-los em
`Project > Options > Building > Delphi Compiler > Compiling` (caminho do
Delphi 10.4.1; versões anteriores variam), opção **Generate XML documentation**.
Defina também o diretório de saída em "XML documentation output directory";
recomendado `.\$(Platform)\$(Config)`, para que os XML fiquem na mesma pasta do
executável.

### Importando no Swagger

```delphi
uses XData.Aurelius.ModelBuilder;

TXDataModelBuilder.LoadXmlDoc(XDataServer.Model);
```

Coloque essa linha no início da aplicação: no `.dpr`, na `initialization` de
alguma unit, ou no `OnCreate` do data module com os componentes XData/Sparkle. Com
multi-model, passe o model correto.

`LoadXmlDoc` procura os XML no diretório da aplicação. Para outro caminho:

```delphi
TXDataModelBuilder.LoadXmlDoc(XDataServer.Model, 'C:\MyXMLFiles');
```

> Desde a 5.20, se um XML inválido for carregado, a mensagem de erro inclui o nome
> do arquivo (no Delphi 11 e anteriores — do 12 em diante isso já vinha na exceção).

### Documentação diferente para Help Insight e Swagger

Reusar a mesma documentação é o normal. Mas se você quiser textos diferentes para
desenvolvedores Delphi e para consumidores da API REST, use a tag `swagger`, com o
atributo `name` para diferenciar as partes:

- `<swagger>` sem `name` → conteúdo geral usado só no Swagger
- `<swagger name="param-A">` → descrição do parâmetro A só no Swagger
- `<swagger name="remarks">` → remarks só no Swagger

As tags XML normais (`summary`, `param`) continuam valendo para o Help Insight.

---

## 8. Tags e tag groups

Endpoints são agrupados em **tags**. Por padrão o nome da tag é o segmento de path
da interface, e a descrição é vazia.

- nome da tag: `<swagger name="tag-name">...</swagger>`
- descrição da tag: tag `summary` comum, ou `<swagger name="tag-description">...</swagger>`

O Redoc suporta ainda **tag groups**, um nível acima:

```delphi
/// <swagger name="tag-group">Customers</swagger>
/// <swagger name="tag-name">Customer Authentication</swagger>
/// <swagger name="tag-description">Endpoints for authenticating customers</swagger>
ICustomerAuthenticationService = interface(IInvokable)
```

> **Armadilha do Redoc:** ao usar tag groups, uma tag que não esteja em nenhum
> grupo **não é exibida**. Toda tag precisa pertencer a pelo menos um grupo.

Para não marcar tudo manualmente, defina um grupo padrão:

```delphi
XDataServer1.SwaggerOptions.DefaultTagGroup := 'Other';
```

---

## 9. required e deprecated

Marcar uma propriedade como obrigatória na documentação, independentemente do
modelo:

```delphi
/// <swagger name="required" />
FSomeRequiredProperty: Integer;
```

Marcar um endpoint como deprecado:

```delphi
/// <swagger name="deprecated" />
function Sum(A, B: Double): Double;
```

---

## 10. Importador OpenAPI (deprecado)

O importador que gerava contratos de serviço e DTOs a partir de um Swagger de
terceiros **saiu do XData**. As classes não existem mais (`TOpenApiImporter`,
`XData.OpenApi.Importer` etc.).

Ele virou um projeto open source independente:
`https://github.com/landgraf-dev/openapi-delphi-generator`

Se alguém pedir para usar o importador embutido do XData, aponte para o projeto
externo. A ideia de uso final continua a mesma: a unit gerada traz interfaces de
contrato e DTOs, consumidos por um `TXDataClient` como se fossem de um servidor
XData — a diferença é que o servidor é uma API de terceiros.
