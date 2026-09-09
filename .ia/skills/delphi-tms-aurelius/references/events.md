# Eventos

Sistema de callbacks para reagir a inserção, atualização, remoção,
mudança de coleção e execução de SQL.

Os eventos vivem na propriedade `Events` do **`TMappingExplorer`**
(um `TManagerEvents`, unit `Aurelius.Events.Manager`) — ou seja, são
globais para aquele modelo: qualquer `TObjectManager` criado com aquele
explorer dispara os listeners.

Convenção de nomes: propriedade `On<Evento>`, tipo de referência de método
`T<Evento>Proc`, objeto de argumentos `T<Evento>Args`.

## Três formas de assinar

**1. Código, com método anônimo**

```pascal
uses {...}, Aurelius.Mapping.Explorer, Aurelius.Events.Manager;

TMappingExplorer.Default.Events.OnInserted.Subscribe(
  procedure(Args: TInsertedArgs)
  begin
    // Args.Entity = entidade inserida
  end
);
```

**2. Código, com referência de método**

```pascal
Events := TMappingExplorer.Default.Events;
Events.OnInserted.Subscribe(MeuProcInserted);
Events.OnUpdated.Subscribe(MeuProcUpdated);
```

Todos os eventos são **multicast**: vários listeners no mesmo evento, sem
um substituir o outro. Use `Subscribe` / `Unsubscribe`.

**Armadilha do Unsubscribe:** como listeners são referências de método,
você precisa passar *a mesma referência*. Guardar numa variável funciona;
passar o nome do método direto, não:

```pascal
var LocalProc: TInsertedProc;
begin
  LocalProc := MeuProcInserted;
  Events.OnInserted.Subscribe(LocalProc);
  ...
  Events.OnInserted.Unsubscribe(LocalProc);   // funciona
end;

Events.OnInserted.Subscribe(MeuProcInserted);
Events.OnInserted.Unsubscribe(MeuProcInserted);  // NÃO cancela
```

**3. Componente `TAureliusModelEvents`**

Abordagem RAD: solte o componente no form e dê duplo clique no evento
desejado no object inspector. São exatamente os mesmos eventos. A
propriedade `ModelName` define o(s) modelo(s) (vários separados por
vírgula; vazio = modelo padrão).

Os handlers são cumulativos também aqui: dois `TAureliusModelEvents`
tratando o mesmo evento fazem os dois handlers dispararem.

**4. Atributos na própria entidade**

```pascal
type
  {$RTTI EXPLICIT METHODS([vcPrivate..vcPublished])}
  TCliente = class
  strict private
    [OnInserting] procedure AoInserir(Args: TInsertingArgs);
    [OnInserted]  procedure DepoisDeInserir;
    [OnUpdated, OnInserted] procedure AposModificacao;
  end;
```

**Atenção:** sem a diretiva `{$RTTI EXPLICIT METHODS([vcPrivate..vcPublished])}`
o Delphi não gera RTTI para métodos não publicados e o Aurelius **não
chama** esses métodos. Mesma pegadinha do `[OnValidate]`.

O método pode receber o `Args` do tipo do evento ou **nenhum parâmetro**
(útil para não acoplar a classe ao tipo do evento). O mesmo método pode
tratar vários eventos.

## Eventos disponíveis

### OnInserting / OnInserted

Antes / depois do INSERT. Disparam **por entidade**: um único
`Manager.Save` pode inserir várias entidades por cascade, e o evento é
disparado uma vez para cada.

| Propriedade | Descrição |
|---|---|
| `Manager: TBaseObjectManager` | manager que disparou |
| `Entity: TObject` | a entidade |
| `Master: TMasterObjectValue` | objeto pai — vem preenchido no caso de itens de `ManyValuedAssociation` **unidirecional** (sem referência de volta). Tem `MasterObject` (instância do pai) e `MasterAssocMember` (nome da propriedade lista) |

### OnUpdating / OnUpdated

Antes / depois do UPDATE.

| Propriedade | Descrição |
|---|---|
| `Manager` | manager que disparou |
| `Entity` | a entidade |
| `OldColumnValues: TDictionary<string, Variant>` | estado antigo por **nome de coluna**, não de propriedade (propriedade `Nome` mapeada em `CUSTOMER_NAME` aparece como `CUSTOMER_NAME`). Associações aparecem como as colunas de FK |
| `NewColumnValues: TDictionary<string, Variant>` | idem, com o estado novo |
| `ChangedColumnNames: TList<string>` | colunas que entram no UPDATE |
| `RecalculateState: Boolean` (só em `OnUpdating`) | se você alterou alguma propriedade da entidade dentro do handler, **set para True** para o Aurelius recalcular as colunas modificadas e atualizar o cache. Deixe False se não alterou nada (melhor performance) |

### OnDeleting / OnDeleted

Antes / depois do DELETE. Também disparam por entidade (cascades).

Em `OnDeleted` a referência da entidade **ainda é válida**, mas o objeto
será destruído logo que o listener retornar.

Propriedades: `Manager`, `Entity`.

### OnCollectionItemAdded / OnCollectionItemRemoved

Disparam a **nível de banco**: quando a FK do item passa a apontar para o
pai (added) ou vai a null / muda de pai (removed).

| Propriedade | Descrição |
|---|---|
| `Manager` | manager que disparou |
| `Parent: TObject` | entidade pai que contém a coleção |
| `Item: TObject` | o item |
| `MemberName: string` | nome do membro do pai que guarda a coleção |

### OnSqlExecuting

Antes de cada statement. É o gancho para log de SQL.

| Propriedade | Descrição |
|---|---|
| `SQL: string` | o statement |
| `Params: TEnumerable<TDBParam>` | parâmetros; cada `TDBParam` tem `ParamName`, `ParamType`, `ParamValue` |

```pascal
TMappingExplorer.Default.Events.OnSqlExecuting.Subscribe(
  procedure(Args: TSQLExecutingArgs)
  begin
    Logar(Args.SQL);
  end
);
```
