# Data binding — TAureliusDataset

Unit: `Aurelius.Bind.Dataset`. É um `TDataset` de verdade: funciona com
controles data-aware da VCL, LiveBindings do FireMonkey e componentes de
terceiros. Suporta campos calculados, `Locate`, lookup, filtro e
master-detail via nested datasets.

Fluxo básico:

1. definir a origem dos dados (`SetSourceList`, `SetSourceObject`,
   `SetSourceCursor` ou `SetSourceCriteria`);
2. opcionalmente criar `TField` persistentes (senão são criados campos
   default);
3. opcionalmente ligar um `TObjectManager` na propriedade `Manager`
   (senão nada é persistido no banco).

## Fornecendo objetos

**Lista externa**

```pascal
Pessoas := Manager.Find<TPessoa>.List;
DS.SetSourceList(Pessoas);          // dataset NÃO é dono da lista
DS.SetSourceList(Pessoas, True);    // dataset destrói a lista ao FECHAR
```

Com `True`, ao fechar o dataset a lista é destruída — para reabrir é
preciso fornecer uma lista nova.

**Objeto único**

```pascal
DS.SetSourceObject(Cliente);
```

O dataset sempre trabalha com listas: `SetSourceObject` limpa a lista
interna e adiciona o objeto nela.

**Cursor (fetch-on-demand online)**

```pascal
DS.SetSourceCursor(Manager.Find<TPessoa>.Open);
```

Só busca o necessário (o que o grid mostra). Mantém conexão e query
abertas até tudo ser buscado ou o dataset fechar. O cursor é liberado
pelo próprio dataset.

**Criteria com paginação (fetch-on-demand offline)**

```pascal
DS.SetSourceCriteria(Manager.Find<TPessoa>);        // busca tudo
DS.SetSourceCriteria(Manager.Find<TPessoa>, 50);    // páginas de 50
```

Com page size, usa `Skip`/`Take` internamente e executa uma nova query a
cada bloco. Vantagem sobre o cursor: não mantém conexão aberta.
Desvantagem: várias queries. O `TCriteria` é destruído pelo dataset.

## Lista interna

`SetSourceCursor`, `SetSourceCriteria` e `SetSourceObject` usam a lista
interna, exposta em somente-leitura:

```pascal
property InternalList: IReadOnlyObjectList;

IReadOnlyObjectList = interface
  function Count: integer;
  function Item(I: integer): TObject;
  function IndexOf(Obj: TObject): integer;
end;
```

Com `SetSourceList` a lista interna é ignorada.

## Campos

Cada campo corresponde a uma propriedade do objeto.

```pascal
Nome := DS.FieldByName('Nome').AsString;
DS.FieldByName('Nascimento').AsDateTime := EncodeDate(1980,1,1);
```

**Classe base.** Define quais campos default são criados e qual classe é
instanciada ao inserir. Vem do tipo genérico da lista (`TList<TCliente>` →
`TCliente`), da classe do objeto em `SetSourceObject`, ou manualmente:

```pascal
DS.SetSourceList(Lista);
DS.ObjectClass := TMidia;     // sempre DEPOIS de SetSourceList/Object
```

**Campo `Self`.** Campo entidade que referencia o objeto do registro atual:

```pascal
Cliente := DS.Current<TCliente>;
Cliente := DS.EntityFieldByName('Self').AsEntity<TCliente>;   // equivalente
```

**Subpropriedades.** Acesso com pontos, leitura e escrita, sem limite de
nível:

```pascal
DS.FieldByName('Pais.Nome').AsString := 'Alemanha';
DS.FieldByName('Nota.Cliente.Pais.Nome').AsString;
```

**Não** são criados por default — declare o campo persistente antes de
abrir:

```pascal
with TStringField.Create(Self) do
begin
  FieldName := 'Pais.Nome';
  Dataset := DS;
end;
```

Ou use `SubpropsDepth := 1` para gerar automaticamente um nível.

**Entity fields (associações).** `TAureliusEntityField` é um
`TVariantField` com `AsObject` e `AsEntity<T>`. Guarda a **referência** ao
objeto — serve para lookup e para trocar a associação por código, **não**
para exibir em DBGrid/DBEdit (para isso use subpropriedade).

```pascal
DS.EntityFieldByName('Pais').AsObject := TPais.Create;
Pais := DS.EntityFieldByName('Pais').AsEntity<TPais>;
```

**Dataset fields (coleções).** Uma coleção `TList<T>` vira `TDatasetField`,
base do master-detail:

```pascal
NotasDS.SetSourceList(Lista);
NotasDS.Manager := Manager1;
NotasDS.Open;
ItensDS.DatasetField := NotasDS.FieldByName('Itens') as TDatasetField;
ItensDS.Open;
```

`ParentManager` (default True) faz o detalhe herdar o `Manager` do mestre —
então Post/Delete no detalhe persiste na hora. Para acumular em memória e
só gravar junto com o mestre, `ItensDS.Manager := nil` (isso zera
`ParentManager`).

**Listas heterogêneas (herança).** Campos que não existem no objeto
retornam NULL na leitura em vez de erro — então um grid com coluna
`Raca` mostra valor para `TCachorro` e vazio para `TAve`. Na **escrita**,
propriedade inexistente gera erro no Post. Trocar `ObjectClass` entre
inserções permite criar tipos diferentes na mesma lista.

**Enumerações.** Campo inteiro com o valor ordinal; sufixo `.EnumName` dá
a versão string:

```pascal
DS.FieldByName('Sexo').AsInteger := Ord(sxFeminino);
DS.FieldByName('Sexo.EnumName').AsString := 'sxFeminino';
```

**Projeções.** Resultados `TCriteriaResult` viram campos, mas o dataset
não sabe antecipadamente quais existem — declare os campos persistentes
(com o alias da projeção) antes de abrir.

## Modificando dados

`Edit`/`Insert`/`Append` + `Post`/`Cancel`, como em qualquer TDataset.

O dataset atualiza **os objetos em memória**. Gravar no banco só acontece
se `Manager` estiver setado ou se você tratar os eventos de persistência.

**Criação de objetos ao inserir.** O objeto é criado ao entrar em estado
de inserção (padrão) ou só no Post, se `CreateObjectOnPost := True`. A
classe é a classe base. Alternativa:

```pascal
procedure TForm1.DSCreateObject(Dataset: TDataset; var NewObject: TObject);
begin
  NewObject := TAve.Create;
end;
```

Se o handler deixar `NewObject` em nil, o dataset cria pela classe base.

**Propriedade `Manager`.** Setada, Post e Delete chamam Save/Update/Remove
do `TObjectManager`. Não setada, tudo fica em memória.

**Ciclo de vida.** O `TAureliusDataset` normalmente **não** gerencia nada:
nem as entidades, nem a lista passada em `SetSourceList`, nem os objetos
que ele criou ao inserir. Deletar um registro **não** destrói o objeto
(vazamento clássico). Duas exceções em que o dataset destrói:

1. registro em estado de inserção que é cancelado antes do Post;
2. objetos `TCriteriaResult` vindos de `SetSourceCursor`/`SetSourceCriteria`.

Se houver `Manager`, quem gerencia as entidades é o manager (a lista ainda
é sua).

**Eventos de persistência manual** (tipo `TDatasetObjectEvent`):

```pascal
property OnObjectInsert: TDatasetObjectEvent;   // após Post de Insert/Append
property OnObjectUpdate: TDatasetObjectEvent;   // após Post de Edit
property OnObjectRemove: TDatasetObjectEvent;   // ao deletar
```

**Atenção:** se um desses handlers estiver setado, o `Manager` é ignorado
para aquela operação — você passa a ser responsável por persistir.

## Locate, calculados, lookup, filtro

```pascal
Achou := DS.Locate('Nome', 'mi', [loCaseInsensitive, loPartialKey]);
```

Em entity field é preciso comparar a **mesma referência**, com typecast:

```pascal
Notas.Locate('Cliente', IntPtr(Cliente), []);
// mais robusto:
Notas.Locate('Cliente.Nome', Cliente.Nome, []);
```

Campos calculados e `OnFilterRecord` funcionam normalmente; dentro deles
dá para usar `FieldByName` ou `Current<T>` para acessar o objeto direto.

Lookup em associação usa o campo `Self` do dataset de lookup:

```pascal
LookupField.FieldKind        := fkLookup;
LookupField.Dataset          := Notas;
LookupField.LookupDataset    := Clientes;
LookupField.LookupKeyFields  := 'Self';
LookupField.LookupResultField := 'Nome';
LookupField.KeyFields        := 'Cliente';
```

## Design-time

Menu de contexto do componente → "Load Field Definitions...": carrega uma
classe de um package e preenche `FieldDefs`. Para isso funcionar bem,
**compile suas entidades num package**. O diálogo preenche `FieldDefs`,
não cria os `TField` — use "Add All Fields" no editor de campos depois.

## Outras propriedades e métodos

| Membro | Efeito |
|---|---|
| `FillRecord(Obj)` | copia todos os valores de `Obj` para os campos |
| `RefreshRecord` | recarrega os campos a partir do objeto (use após alterar o objeto diretamente) |
| `CreateSelfField` | inclui o campo `Self` nos defaults (default True) |
| `DefaultsFromObject` | ao inserir, valores iniciais vêm do objeto em vez de NULL (default False) |
| `FieldInclusions` | quais categorias especiais criar; default `[Entity, Dataset]` |
| `IncludeUnmappedObjects` | também cria campos para objetos/listas não mapeados (default False) |
| `ReadOnly` | bloqueia edição por controles data-aware |
| `SubpropsDepth` | níveis de subpropriedade criados automaticamente (default 0) |
| `SyncSubProps` | ao trocar o entity field, atualiza as subpropriedades (default False) |
| `RecordCountMode` | `Default` (-1 até buscar tudo), `Retrieve` (query extra de contagem), `FetchAll` (busca tudo) |
