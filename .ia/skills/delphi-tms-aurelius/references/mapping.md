# Mapeamento (classes → banco)

Todos os atributos ficam em `Aurelius.Mapping.Attributes`.
`Nullable<T>` fica em `Bcl.Types.Nullable`.

## Índice

- [Catálogo de atributos](#catálogo-de-atributos)
- [Entidade, tabela e identificador](#entidade-tabela-e-identificador)
- [Colunas](#colunas)
- [Nullable](#nullable)
- [Enumerações](#enumerações)
- [Índices e chaves únicas](#índices-e-chaves-únicas)
- [Automapping](#automapping)
- [Entidades abstratas](#entidades-abstratas)
- [Blobs](#blobs)
- [Associações](#associações)
- [Herança](#herança)
- [Id composto](#id-composto)
- [Where e OrderBy no mapeamento](#where-e-orderby-no-mapeamento)
- [Registro de entidades](#registro-de-entidades)
- [Multi-model](#multi-model)
- [Propriedades dinâmicas](#propriedades-dinâmicas)

## Catálogo de atributos

**Básico:** `Entity`, `AbstractEntity`, `Id`, `Table`, `Column`,
`Sequence`, `UniqueKey`, `Enumeration`
**Associação:** `Association`, `JoinColumn`, `ManyValuedAssociation`,
`ForeignJoinColumn`
**Comportamento:** `Where`, `OrderBy`
**Estrutura de banco:** `DBIndex`, `ForeignKey`
**Herança:** `Inheritance`, `DiscriminatorColumn`, `DiscriminatorValue`,
`PrimaryJoinColumn`
**Automapping:** `Automapping`, `Transient`
**Concorrência:** `Version`
**Outros:** `Model`, `Description`

Regra: atributos vão em **field** ou em **property**, nunca nos dois para
o mesmo membro. Prefira fields (ficam na seção private, representam o
estado e são obrigatórios para `Proxy<T>`).

## Entidade, tabela e identificador

```pascal
  [Entity]
  [Table('CLIENTES', 'dbo')]              // schema é opcional
  [Sequence('SEQ_CLIENTES')]
  [Id('FId', TIdGenerator.IdentityOrSequence)]
  TCliente = class
  private
    [Column('CLIENTE_ID', [TColumnProp.Required, TColumnProp.NoUpdate])]
    FId: Integer;
  public
    property Id: Integer read FId;
  end;
```

Sem `[Entity]` a classe é ignorada pelo Aurelius.

Estratégias de `TIdGenerator`:

| Estratégia | Efeito |
|---|---|
| `IdentityOrSequence` | usa sequence/generator ou coluna identity |
| `Guid` | gera GUID |
| `SmartGuid` | GUID sequencial, reduz fragmentação de índice |
| `None` | a aplicação atribui o Id manualmente |

## Colunas

```pascal
  [Column('NOME', [TColumnProp.Required], 100)]      // tamanho
  FNome: string;

  [Column('SALDO', [], 18, 4)]                       // precisão, escala
  FSaldo: Currency;
```

`TColumnProp`: `Required` (NOT NULL), `Unique`, `NoInsert`, `NoUpdate`,
`Lazy` (só para `TBlob`).

## Nullable

```pascal
  FNascimento: Nullable<TDate>;
...
  FNascimento := EncodeDate(2000, 1, 1);
  if FNascimento.IsNull then ...;
  FNascimento := SNull;             // seta NULL
```

No automapping, todo `Nullable<T>` vira coluna nullable; tipos primitivos
comuns viram NOT NULL.

## Enumerações

O atributo vai na **declaração do tipo enumerado**:

```pascal
  [Enumeration(TEnumMappingType.emChar, 'M,F')]
  TSexo = (sxMasculino, sxFeminino);

  [Enumeration(TEnumMappingType.emInteger)]
  TStatus = (stAtivo, stInativo, stPendente);
```

Com `emChar`/`emString` a lista de valores é separada por vírgula e deve
seguir a ordem dos valores do enum.

## Índices e chaves únicas

```pascal
  [UniqueKey('TIPO_NOTA, NUMERO_NOTA')]
  [DBIndex('IDX_NOTA_DATA', 'DATA_EMISSAO')]
  TNota = class ... end;
```

## Automapping

```pascal
  [Entity]
  [Automapping]
  TPais = class
  private
    FId: Integer;
    FNome: string;
  ...
```

Regras padrão:

| Aspecto | Regra |
|---|---|
| Tabela | nome da classe sem o `T` inicial, em MAIÚSCULA_COM_UNDERSCORE (`TMinhaNota` → `MINHA_NOTA`) |
| Coluna | nome do field sem o `F` inicial, mesmo esquema (`FPrimeiroNome` → `PRIMEIRO_NOME`) |
| Nulidade | `Nullable<T>` → nullable; demais → NOT NULL |
| Identificador | field chamado `FID` |
| Sequence | `SEQ_` + nome da tabela |
| Properties | **não** são mapeadas — só fields |
| Associações | field de objeto → many-to-one; `TList<T>` → many-valued |
| Enumerações | não automapeadas (salvo config global em modo Full) |
| Herança | **não** automapeada — declarar explicitamente |

Automapping não é tudo-ou-nada: qualquer membro pode receber atributo
explícito, que sobrepõe a regra. `[Transient]` exclui um field do
mapeamento.

Para mudar convenções de nome globalmente, herde de
`TAutomappingEngine` (sobrescreva `FieldNameToSql`, `GetTableName`,
`GetSequenceName`) e passe a classe: `[Automapping(TMeuAutomapping)]`.

## Entidades abstratas

`[AbstractEntity]` marca uma base não persistida que contribui mapeamento
para os descendentes — útil para um `TEntidadeBase` com Id e auditoria.

```pascal
  [AbstractEntity]
  [Automapping]
  [Id('FId', TIdGenerator.IdentityOrSequence)]
  TEntidadeBase = class
  strict private
    FId: Integer;
    FCriadoEm: TDateTime;
  ...
```

Suportado em abstract entity: colunas, `Id`, associações, eventos e
validações por atributo, filtros globais.
**Não** suportado: `Table`, `Sequence`, `UniqueKey`, `DBIndex`,
`ForeignKey`, atributos de estratégia de herança.

## Blobs

Use `TArray<Byte>` ou, preferencialmente, `TBlob` (suporta lazy e tem
métodos auxiliares).

```pascal
  [Column('FOTO', [TColumnProp.Lazy])]
  FFoto: TBlob;      // Lazy exige TBlob
```

Com `Lazy`, a coluna é omitida no SELECT da entidade e carregada num
SELECT separado no primeiro acesso.

## Associações

### Muitos-para-um

```pascal
  [Association([], CascadeTypeAllButRemove)]
  [JoinColumn('ID_PAIS', [])]
  FPais: TPais;
```

Versão lazy com proxy:

```pascal
  [Association([TAssociationProp.Lazy], CascadeTypeAllButRemove)]
  [ForeignKey('FK_CLIENTE_PAIS')]        // opcional: nome da FK
  [JoinColumn('ID_PAIS', [])]
  FPais: Proxy<TPais>;
  function GetPais: TPais;
  procedure SetPais(const Value: TPais);
public
  property Pais: TPais read GetPais write SetPais;

implementation

function TCliente.GetPais: TPais;
begin
  Result := FPais.Value;
end;

procedure TCliente.SetPais(const Value: TPais);
begin
  FPais.Value := Value;
end;
```

`Proxy<T>.Available` diz se o proxy já foi carregado, sem disparar o load.

**Nunca** instancie nem destrua o objeto associado no construtor/destrutor
da classe pai — instanciar faz o objeto ser sobrescrito no load; destruir
arrisca double-free.

### Um-para-muitos (many-valued)

Bidirecional (recomendado) — o filho tem `[Association]` de volta e o pai
referencia esse field em `MappedBy`:

```pascal
// filho
  [Association([TAssociationProp.Lazy], CascadeTypeAllButRemove)]
  [JoinColumn('ID_NOTA', [])]
  FNota: Proxy<TNota>;

// pai
  [ManyValuedAssociation([], CascadeTypeAllRemoveOrphan, 'FNota')]
  property Itens: TList<TItemNota> read FItens;
```

Unidirecional — o filho não tem volta; declare a FK no filho:

```pascal
  [ManyValuedAssociation([], CascadeTypeAllRemoveOrphan)]
  [ForeignJoinColumn('ID_NOTA', [TColumnProp.Required])]
  FItens: TList<TItemNota>;
```

Ciclo de vida: o `TList<T>` é criado no construtor e liberado no
destrutor do pai; **os itens não**. Nunca use `TObjectList<T>` com
`OwnsObjects = True`.

```pascal
constructor TNota.Create;
begin
  FItens := TList<TItemNota>.Create;
end;

destructor TNota.Destroy;
begin
  FItens.Free;
  inherited;
end;
```

Coleção lazy usa `Proxy<TList<T>>` e métodos próprios:

```pascal
  [ManyValuedAssociation([TAssociationProp.Lazy], CascadeTypeAll)]
  [ForeignJoinColumn('ID_NOTA', [TColumnProp.Required])]
  FItens: Proxy<TList<TItemNota>>;

constructor TNota.Create;
begin
  FItens.SetInitialValue(TList<TItemNota>.Create);
end;

destructor TNota.Destroy;
begin
  FItens.DestroyValue;
  inherited;
end;

function TNota.GetItens: TList<TItemNota>;
begin
  Result := FItens.Value;
end;
```

Não acesse `.Value` no construtor/destrutor — use `SetInitialValue` e
`DestroyValue`.

### Cascades

- Many-to-one: `CascadeTypeAllButRemove` é o padrão recomendado.
- Coleções: `CascadeTypeAll` ou `CascadeTypeAllRemoveOrphan`.
  `RemoveOrphan` faz o item removido da lista ser **deletado** do banco;
  sem ele, a FK do item é setada para NULL e a linha fica órfã.
- `TCascadeType` individual: `SaveUpdate`, `Merge`, `Remove`, `Refresh`,
  `Evict`.

## Herança

`[Inheritance]` vai na **raiz** da hierarquia.

### Tabela única

```pascal
  [Entity]
  [Table('MIDIAS')]
  [Inheritance(TInheritanceStrategy.SingleTable)]
  [DiscriminatorColumn('TIPO_MIDIA', TDiscriminatorType.dtString)]
  [Id('FId', TIdGenerator.IdentityOrSequence)]
  TMidia = class ... end;

  [Entity]
  [DiscriminatorValue('MUSICA')]
  TMusica = class(TMidia)
  private
    [Column('DURACAO', [])]
    FDuracao: Nullable<Integer>;   // colunas só de filhos DEVEM ser nullable
  end;
```

Vantagem: sem JOINs. Desvantagem: colunas exclusivas de filhos não podem
ser NOT NULL.

### Tabelas ligadas

```pascal
  [Entity]
  [Table('ANIMAL')]
  [Inheritance(TInheritanceStrategy.JoinedTables)]
  [Id('FId', TIdGenerator.IdentityOrSequence)]
  TAnimal = class ... end;

  [Entity]
  [Table('AVE')]
  [PrimaryJoinColumn('ANIMAL_ID')]     // omitir = mesmo nome da PK do pai
  TAve = class(TAnimal) ... end;
```

Vantagem: schema normalizado. Desvantagem: JOINs no load.

## Id composto

Só use quando um schema legado obrigar. Declare vários `[Id]`; associações
que fazem parte do Id levam um `[JoinColumn]` por coluna:

```pascal
  [Entity]
  [Table('CONSULTA')]
  [Id('FData', TIdGenerator.None)]
  [Id('FPaciente', TIdGenerator.None)]
  TConsulta = class
  strict private
    [Column('DATA_CONSULTA', [TColumnProp.Required])]
    FData: TDateTime;
    [Association([TAssociationProp.Required], [TCascadeType.Merge, TCascadeType.SaveUpdate])]
    [JoinColumn('PACIENTE_SOBRENOME', [TColumnProp.Required])]
    [JoinColumn('PACIENTE_NOME', [TColumnProp.Required])]
    FPaciente: TPessoa;
  end;
```

Em `Find`/`IdEq`, passe um array variante (`VarArrayCreate`) com um
elemento por coluna da PK. Associações que compõem o Id são **sempre**
eager, mesmo declaradas lazy.

## Where e OrderBy no mapeamento

```pascal
  [Entity, Automapping]
  [Where('{Ativo} = 1')]              // filtra TODO retrieval da entidade
  TClienteAtivo = class
  ...
    [ManyValuedAssociation([], CascadeTypeAll)]
    [Where('{Status} = ''Novo''')]
    [OrderBy('Produto.Nome, Categoria DESC')]
    property Novos: TList<TClienteAtivo> read FNovos;
```

Chaves `{}` referenciam **nomes de membros**; o Aurelius traduz para
`alias.coluna`. `OrderBy` também usa nomes de membros, não colunas.

## Registro de entidades

O linker do Delphi remove classes não referenciadas e o Aurelius (que
descobre por RTTI) deixa de enxergá-las. Na unit das entidades:

```pascal
initialization
  RegisterEntity(TCliente);
  RegisterEntity(TPais);
  RegisterEntity(TNota);
```

Essencial em servidores (XData) onde as classes não são instanciadas
diretamente pelo código da aplicação.

## Multi-model

Use quando houver mais de um banco/modelo lógico no mesmo app.

```pascal
  [Entity, Automapping]
  [Model('Seguranca')]
  TUsuario = class ... end;      // pode repetir [Model] para vários modelos
```

Sem `[Model]`, a classe entra no modelo padrão (`'Default'`).

```pascal
uses Aurelius.Mapping.Explorer;

Manager := TObjectManager.Create(Conn, TMappingExplorer.Get('Seguranca'));
DBManager := TDatabaseManager.Create(Conn, TMappingExplorer.Get('Seguranca'));
// padrão: TMappingExplorer.Default (ou simplesmente omitir o parâmetro)
```

Os `TMappingExplorer` obtidos por `Get`/`Default` são globais e destruídos
pelo próprio Aurelius. Já os criados por você (`TMappingExplorer.Create`)
são sua responsabilidade.

Alternativa de baixo nível (raramente necessária): configurar um
`TMappingSetup`, criar o explorer a partir dele, liberar o setup e manter
o explorer vivo pela aplicação. `TMappingSetup.MappedClasses` permite
registrar/desregistrar classes explicitamente
(`RegisterClass`, `RegisterClasses`, `UnregisterClass`, `Clear`,
`GetEntityClasses`, `GetDefaultClasses`, `GetModelClasses`).
Para trocar o explorer padrão da aplicação:
`TMappingExplorer.ReplaceDefaultInstance(TMappingExplorer.Create(Setup))` —
e garanta que nenhum `TObjectManager` esteja vivo usando o explorer antigo.

## Propriedades dinâmicas

Para colunas que só se conhece em runtime (schema variável por cliente).
A classe recebe um container `TDynamicProperties`
(`Aurelius.Types.DynamicProperties`), criado e destruído por ela:

```pascal
  FProps: TDynamicProperties;
  property Props: TDynamicProperties read FProps;
...
MinhaPessoa.Props['Extra'] := 'valor';
```

O registro é feito em um `TMappingSetup`:

```pascal
Lista := ASetup.DynamicProps[TPessoa];
Lista.Add(TDynamicProperty.Create('Props', 'Extra', TypeInfo(string),
  TDynamicColumn.Create('COL_EXTRA', [], 30)));

Prop := TDynamicProperty.Create('Props', 'Cliente', TypeInfo(TCliente));
Lista.Add(Prop);
Prop.AddAssociation(Association.Create([TAssociationProp.Required], CascadeTypeAllButRemove));
Prop.AddColumn(JoinColumn.Create('CLIENTE_ID', []));
```

O tipo informado é o do **membro da classe** (inclusive `Proxy<T>` ou
`TList<T>`), não o da coluna. `Nullable<T>` não é usado: toda propriedade
dinâmica já é nullable.
