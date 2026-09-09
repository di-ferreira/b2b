# Dictionary, JSON e configuração global

## Dictionary — queries sem strings mágicas

Em vez de `Linq['Nome']`, o dictionary dá acesso tipado com code
completion e erro em tempo de compilação:

```pascal
// frágil: erro só aparece em runtime
Manager.Find<TCliente>.Where(Linq['Nome'].Like('M%')).List;

// com dictionary
Manager.Find<TCliente>.Where(Dic.Cliente.Nome.Like('M%')).List;
```

**Só use a partir do Delphi XE6.** Versões anteriores têm problemas de
RTTI que quebram o dictionary, especialmente o validador.

### Gerando o dictionary

É uma unit `.pas` gerada. Três caminhos:

**A partir da aplicação** (code-first) — `Aurelius.Dictionary.Generator`:

```pascal
uses Aurelius.Dictionary.Generator;

TDictionaryGenerator.GenerateFile('C:\Pasta\MeuDictionary.pas');
```

Versão com controle fino:

```pascal
Generator := TDictionaryGenerator.Create(TMappingExplorer.Get('Contabil'));
try
  Generator.DictionaryId   := 'MinhaContabil';  // → IMinhaContabilDictionary / TMinhaContabilDictionary
  Generator.GlobalVarName  := 'D';              // padrão: Dic → acessa como D.Cliente
  Generator.OutputUnitName := 'ContabilDictionary';  // padrão: Unit1
  SourceCode := Generator.GenerateSource;
  TFile.WriteAllText('C:\Pasta\ContabilDictionary.pas', SourceCode);
finally
  Generator.Free;
end;
```

Por padrão o `DictionaryId` é o nome do modelo e a variável global é `Dic`.

**A partir do banco** (database-first) — tanto o TMS Data Modeler quanto o
wizard "generate entities" do `TAureliusConnection` têm a opção de gerar o
dictionary junto com as classes.

**Ferramenta de linha de comando** — `AureliusDictionaryGenerator.exe`,
com fonte na pasta de demos. Precisa de um `.bpl` compilado com as
entidades:

```
AureliusDictionaryGenerator.exe <ArquivoSaida> [opções]
  -p, /package:valor    o .bpl de onde extrair o modelo   (obrigatório)
  -i, /id:valor         id do dictionary                  (obrigatório)
  -g, /globalvar:valor  nome da variável global, padrão Dic
  -m, /model:valor      nome do modelo, padrão Default
```

```
AureliusDictionaryGenerator.exe -i:Default -p:"C:\Proj\Bpl\Entities" "C:\Proj\MeuDictionary.pas"
```

### Usando

Adicione a unit gerada ao uses; o acesso é pela variável global (`Dic` por
padrão). Cada propriedade do dictionary é uma **projeção**, então todos os
métodos de projeção valem (`Sum`, `Contains`, `Group`, `Like`...).

```pascal
Manager.Find<TCliente>
  .Where(Dic.Cliente.NomePais = 'Alemanha')
  .Where(Dic.Cliente.Nome.Contains('Herwig'));

Manager.Find<TNota>
  .Where((Dic.Nota.Emissao >= EncodeDate(2020,10,10))
     and (Dic.Nota.Emissao < EncodeDate(2021,2,2)))
  .OrderBy(Dic.Nota.Codigo);
```

Associações: basta descer níveis.

```pascal
Manager.Find<TNota>
  .Select(Dic.Nota.Total.Sum)
  .Where(Dic.Nota.Cliente.Pais.Nome = 'Brasil');
```

Para encurtar, guarde a associação numa variável tipada:

```pascal
var Orc: IOrcamentoDictionary;
begin
  Orc := Dic.Orcamento;
  Manager.Find<TOrcamento>
    .Select(TProjections.ProjectionList
      .Add(Orc.Numero.Sum)
      .Add(Orc.Cliente.Nome.Group))
    .Where(Orc.Emissao.IsNotNull)
    .OrderBy(Orc.Cliente.Nome);
```

### Validação do dictionary

O dictionary é gerado, logo pode ficar desatualizado (propriedade
renomeada, classe nova) — e o erro volta a ser de runtime. O validador
resolve isso com uma linha, executada no início da aplicação:

```pascal
uses Aurelius.Dictionary.Validator;

TDictionaryValidator.Check(Dic);

TDictionaryValidator.Check(ContabilDictionary.Dic,
  TMappingExplorer.Get('Contabil'));
```

Levanta `EDictionaryValidationException`, cuja propriedade `Errors` traz o
detalhe. Versão silenciosa:

```pascal
Validator := TDictionaryValidator.Create(TMappingExplorer.Default);
if not Validator.Validate(Dic) then
  for ErrorMessage in Validator.Errors do
    Logar(ErrorMessage);
```

## Aplicações distribuídas — JSON

Aurelius não obriga ancestral nem interface específica nas entidades, o
que permite usar praticamente qualquer framework de aplicação
distribuída. Para transporte, ele traz serializadores JSON.

```pascal
Serializer := TDataSnapJsonSerializer.Create;
try
  JsonValue := Serializer.ToJson(Cliente);
finally
  Serializer.Free;
end;

Deserializer := TDataSnapJsonDeserializer.Create;
try
  Cliente := Deserializer.FromJson<TCliente>(JsonValue);
finally
  Deserializer.Free;
end;
```

| Framework | Serializer | Deserializer | Classe JSON |
|---|---|---|---|
| DataSnap | `TDataSnapJsonSerializer` | `TDataSnapJsonDeserializer` | `TJsonValue` |
| SuperObject | `TSuperObjectJsonSerializer` | `TSuperObjectJsonDeserializer` | `ISuperObject` |

Units: `Aurelius.Json.DataSnap`, `Aurelius.Json.SuperObject`.

Ambos aceitam um `TMappingExplorer` no construtor; sem parâmetro usam o
mapeamento padrão.

### O que sai no JSON

Só os membros mapeados, mais metacampos com `$` para uso interno do
Aurelius:

```json
{
  "$type": "Artist.TArtist",
  "$id": 1,
  "FId": 2,
  "ArtistName": "Smashing Pumpkins",
  "Genre": "Alternative"
}
```

`Nullable<T>` e propriedades dinâmicas são tratados automaticamente.
Blobs viram base64.

Associações carregadas são serializadas inteiras. As **lazy não
carregadas** viram metadados de proxy:

```json
"FAlbum": { "$proxy": "single", "key": 2, "class": "TMediaFile", "member": "FAlbum" }
```

### Lazy loading via JSON

Na desserialização, o proxy chama `LoadProxyValue` do `IJsonProxyLoader`
que você fornecer em `Deserializer.ProxyLoader`:

```pascal
IJsonProxyLoader = interface
  function LoadProxyValue(ProxyInfo: IProxyInfo): TObject;
end;

// Aurelius.Types.Proxy
IProxyInfo = interface
  function ProxyType: TProxyType;
  function ClassName: string;
  function MemberName: string;
  function Key: Variant;
end;
```

Uso típico (cliente pede o objeto ao servidor sob demanda):

```pascal
Deserializer.ProxyLoader := TJsonProxyLoader.Create(
  function(ProxyInfo: IProxyInfo): TObject
  begin
    // envia ProxyInfo ao servidor e desserializa a resposta
  end
);
Song := Deserializer.FromJson<TSong>(JsonComSong);
...
Album := Song.Album;   // aqui o ProxyLoader é acionado
```

Pode destruir o deserializer depois — a referência ao proxy loader fica no
próprio objeto. No servidor, o par disso é
`TObjectManager.ProxyLoad(ProxyInfo)`:

```pascal
function TMeuServidor.RemoteProxyLoad(JsonProxyInfo: TJsonValue): TJsonValue;
begin
  ProxyInfo := Deserializer.ProxyInfoFromJson<IProxyInfo>(JsonProxyInfo);
  Result := Serializer.ToJson(ObjectManager.ProxyLoad(ProxyInfo));
end;
```

Blobs lazy funcionam igual, via `Deserializer.BlobLoader`
(`IJsonBlobLoader.ReadBlob(BlobInfo: IBlobInfo): TArray<byte>`,
`Aurelius.Types.Blob`) e `TObjectManager.BlobLoad` no servidor.

### Memória no JSON

Sem object manager, quem destrói os objetos criados na desserialização é
você — e não é só o objeto raiz, são todos os associados
(`Song.Album.AlbumType`...). Duas saídas:

```pascal
Deserializer.OwnsEntities := True;   // destrói tudo que criou (exceto listas)
...
Deserializer.Free;                   // aqui Song e associados morrem
```

ou rastrear você mesmo, via evento `OnEntityCreated` ou via a propriedade
`Entities: TEnumerable<TObject>` do deserializer.

Cuidado também com o lado da serialização: o `TJsonValue` devolvido por
`ToJson` é seu para destruir (em DataSnap, muitas vezes o framework
cuida — mas não sempre).

## Configuração global

`Aurelius.Global.Config`, singleton `TGlobalConfigs.GetInstance`:

```pascal
uses Aurelius.Global.Config;
Configs := TGlobalConfigs.GetInstance;
```

| Propriedade | Efeito |
|---|---|
| `SimuleStatements: Boolean` | statements não são executados no banco, só aparecem nos listeners |
| `MaxEagerFetchDepth: Integer` | profundidade máxima de eager loading; além dela, carrega lazy |
| `TightStringEnumLength: Boolean` | enum mapeado para string sem tamanho no `Column` gera coluna do tamanho do maior valor; senão usa `DefaultStringColWidth` |
| `AutoMappingMode: TAutomappingMode` | `Off` (só atributos), `ByClass` (só classes com `[Automapping]`), `Full` (tudo, inclusive enumerações) |
| `AutoMappingDefaultCascade` | cascade padrão das associações automapeadas — default `CascadeTypeAll - [TCascadeType.Remove]` |
| `AutoMappingDefaultCascadeManyValued` | idem para many-valued — default `CascadeTypeAll` |
| `DefaultStringColWidth: Integer` | largura de colunas string sem tamanho explícito |
| `UseTransactionsInManager: Boolean` | default de `TObjectManager.UseTransactions` — **True** |
| `UseTransactionsInDBManager: Boolean` | default de `TDatabaseManager.UseTransactions` — **False** |

(`AutoSearchMappedClasses` foi removida na versão 2.0 — use
`TMappingSetup.MappedClasses`.)

## Object factory

Por padrão o Aurelius instancia entidades chamando um `Create` sem
parâmetros. Se suas entidades exigem construtor com parâmetro (ou precisam
de um contexto), implemente `IObjectFactory` (`Bcl.Rtti.ObjectFactory`):

```pascal
IObjectFactory = interface
  function CreateInstance(AClass: TClass): TObject;
end;
```

E substitua, no nível do modelo ou de um manager específico:

```pascal
TMappingExplorer.Default.ObjectFactory := MinhaFactory;
Manager.ObjectFactory := MinhaFactory;
```
