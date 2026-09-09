---
name: tms-aurelius
description: "Como escrever, revisar e depurar código Delphi que usa o ORM TMS Aurelius — entidades mapeadas por atributos, TObjectManager, queries com TCriteria/Linq, associações lazy/eager, TAureliusDataset e TDatabaseManager. Use SEMPRE que aparecer qualquer sinal de Aurelius no pedido ou no código — units Aurelius.*, atributos [Entity], [Automapping], [Column], [Association], [ManyValuedAssociation], tipos TObjectManager, TCriteria, Linq[...], Proxy, Nullable, TAureliusConnection, TAureliusDataset, TDatabaseManager — ou quando o usuário falar em ORM no Delphi, persistir classes em banco, mapear classe para tabela, XData/TMS Business. Use também quando o pedido parecer genérico (salvar esse objeto no banco, consulta filtrando por nome) mas o projeto já usar Aurelius."
---

# TMS Aurelius (ORM para Delphi)

Aurelius é um ORM para Delphi (2010+): você declara classes Delphi comuns,
anota com atributos de mapeamento e o framework gera o SQL. Baseado no
User Guide oficial v5.27.

## Como usar esta skill

O `SKILL.md` cobre o fluxo completo e os erros mais comuns. Para detalhes,
leia o arquivo de referência correspondente **antes** de escrever código:

| Arquivo | Leia quando o pedido envolver |
|---|---|
| `references/mapping.md` | atributos de mapeamento, associações, herança, Nullable, Blob, Proxy, multi-model, propriedades dinâmicas |
| `references/objects.md` | TObjectManager, Save/Flush/Update/Merge/Remove, memória, transações, versionamento, batch/cached updates |
| `references/queries.md` | TCriteria, Linq, projeções, agregações, ordenação, paginação, cursores, polimorfismo |
| `references/dataset.md` | TAureliusDataset, DBGrid, master-detail, lookup, campos calculados |
| `references/connection.md` | IDBConnection, adapters, drivers nativos, dialetos SQL, TDatabaseManager, schema |
| `references/validation.md` | validação declarativa, Required/MaxLength/Range, OnValidate, mensagens, validador customizado |
| `references/filters.md` | filtros globais, multitenancy, soft delete, FilterDef/Filter, filter enforcer |
| `references/events.md` | OnInserting/OnUpdated/OnDeleted, eventos de coleção, OnSqlExecuting, log de SQL |
| `references/dictionary-json-config.md` | dictionary tipado, serialização JSON/DataSnap, configuração global, object factory |

Não invente API. Se um método/atributo não estiver nesta skill, diga que
precisa confirmar na documentação em vez de chutar assinatura.

## Fluxo mínimo (do zero ao CRUD)

```pascal
uses
  Aurelius.Mapping.Attributes,      // atributos de mapeamento
  Aurelius.Drivers.Interfaces,      // IDBConnection
  Aurelius.Drivers.FireDac,         // adapter escolhido
  Aurelius.Sql.Firebird,            // dialeto SQL (registra o gerador)
  Aurelius.Schema.Firebird,         // schema importer (para update/validate)
  Aurelius.Engine.DatabaseManager,  // TDatabaseManager
  Aurelius.Engine.ObjectManager,    // TObjectManager
  Aurelius.Criteria.Base,           // TCriteria
  Aurelius.Criteria.Linq,           // Linq[...]
  Bcl.Types.Nullable;               // Nullable<T>
```

**1. Declare a entidade**

```pascal
type
  [Entity]
  [Automapping]
  TPessoa = class
  private
    FId: Integer;
    FNome: string;
    FEmail: string;
    FNascimento: Nullable<TDate>;
  public
    property Id: Integer read FId;
    property Nome: string read FNome write FNome;
    property Email: string read FEmail write FEmail;
    property Nascimento: Nullable<TDate> read FNascimento write FNascimento;
  end;
```

**2. Obtenha uma IDBConnection**

```pascal
var
  Conn: IDBConnection;
begin
  Conn := TFireDacConnectionAdapter.Create(FDConnection1, False);
  // False = o TFDConnection NÃO é destruído junto com a interface
```

**3. Crie/atualize o schema (opcional, se o banco vem das classes)**

```pascal
DBManager := TDatabaseManager.Create(Conn);
try
  DBManager.UpdateDatabase;   // não destrutivo: nunca dropa tabela/coluna
finally
  DBManager.Free;
end;
```

**4. Persista**

```pascal
Manager := TObjectManager.Create(Conn);
try
  Pessoa := TPessoa.Create;
  Manager.AddOwnership(Pessoa);   // garante destruição mesmo se Save falhar
  Pessoa.Nome := 'João';
  Manager.Save(Pessoa);
finally
  Manager.Free;   // destrói todos os objetos gerenciados
end;
```

**5. Consulte**

```pascal
Lista := Manager.Find<TPessoa>
  .Where(Linq['Email'].Like('%@empresa.com') and Linq['Nome'].IsNotNull)
  .OrderBy('Nome')
  .Take(50)
  .List;
try
  for Pessoa in Lista do
    ShowMessage(Pessoa.Nome);
finally
  Lista.Free;   // destrói a LISTA, não as entidades
end;
```

## Regras de memória (fonte nº 1 de bugs)

Interiorize estas quatro regras; a maioria dos leaks e AVs em Aurelius
vem de violá-las.

1. **O TObjectManager é dono das entidades.** Objetos carregados ou
   salvos pelo manager são destruídos quando o manager é destruído
   (`OwnsObjects = True`, padrão). Não chame `Free` neles.
2. **A lista retornada por `List` é sua.** `Results.Free` destrói só o
   `TList<T>`; as entidades continuam com o manager. Exceção:
   `ListValues` retorna `TObjectList<TCriteriaResult>` com
   `OwnsObjects = True` — aí liberar a lista destrói os itens.
3. **O TCriteria se autodestrói** ao chamar `List`, `ListValues`,
   `UniqueResult`, `UniqueValue` ou `Open`. Não libere manualmente
   (a menos que tenha setado `AutoDestroy := False`, e aí você é
   obrigado a liberar).
4. **`Save` só assume a posse se der certo.** Se levantar exceção o
   objeto fica órfão. Por isso o padrão é `Manager.AddOwnership(Obj)`
   **antes** do `Save`.

Para manter entidades vivas após destruir o manager:
`Manager.OwnsObjects := False;` antes do `Free`.

## Associações: pense em objetos, não em FK

Aurelius representa relacionamento como **referência de objeto**. Nunca
escreva `Invoice.CustomerId := 5`. Escreva:

```pascal
Cliente := Manager.Find<TCliente>(IdCliente);
Pedido.Cliente := Cliente;     // Aurelius grava a FK sozinho
```

**Muitos-para-um** (`[Association]` + `[JoinColumn]`); **um-para-muitos**
(`[ManyValuedAssociation]`). Preferir bidirecional com `MappedBy`.

Cuidados de ciclo de vida:

- **Não** crie/destrua o objeto associado no construtor/destrutor do pai —
  Aurelius gerencia a vida dele (risco de double-free e de sobrescrita
  no load).
- **Sim**, crie e destrua o `TList<T>` da associação many-valued no
  construtor/destrutor — mas só o container, nunca os itens.
- **Nunca** use `TObjectList<T>` com `OwnsObjects = True` numa associação.

Lazy loading usa `Proxy<T>`:

```pascal
  [Association([TAssociationProp.Lazy], CascadeTypeAllButRemove)]
  [JoinColumn('ID_CLIENTE', [])]
  FCliente: Proxy<TCliente>;
  function GetCliente: TCliente;
public
  property Cliente: TCliente read GetCliente write SetCliente;
// GetCliente => Result := FCliente.Value;
```

Ler uma associação lazy dispara SELECT — **o manager precisa estar vivo
nesse momento**. Para evitar N+1 numa listagem, force eager na query:
`.FetchEager('Cliente')` ou `.FetchEager('Cliente.Pais')`.

## Consultas: o essencial

```pascal
uses Aurelius.Criteria.Base, Aurelius.Criteria.Linq, Aurelius.Criteria.Projections;
```

| Objetivo | Código |
|---|---|
| Por Id | `Manager.Find<T>(Id)` (nil se não achar) |
| Um único resultado | `.UniqueResult` (nil se vazio; `EResultsNotUnique` se >1) |
| Lista | `.List` |
| Cursor sob demanda | `.Open` (retorna `ICriteriaCursor<T>`, iterável com `for..in`) |
| Filtro | `.Where(Linq['Campo'] = Valor)` — `Add` é sinônimo de `Where` |
| E / OU | `(Linq['A'] = 1) and (Linq['B'] > 2)` — parênteses são obrigatórios |
| Navegar associação | `Linq['Cliente.Pais.Nome'] = 'Brasil'` (auto alias, gera JOIN) |
| Alias explícito | `.CreateAlias('Cliente', 'c')` e depois `Linq['c.Nome']` |
| Paginação | `.Skip(Pagina * Tam).Take(Tam)` |
| Agregação | `.Select(TProjections.Sum('Valor')).UniqueValue` |
| Agrupamento | `TProjections.ProjectionList.Add(TProjections.Sum('X')).Add(TProjections.Group('c.Nome'))` + `.ListValues` |
| SQL cru seguro | `Linq.Sql('{Nome} = ''X''')` — `{Prop}` vira `alias.coluna` |
| Sem duplicatas | `.RemovingDuplicatedEntities` |

Operadores do `Linq`: `=`, `>`, `>=`, `<`, `<=`, `Like`, `ILike`,
`StartsWith`, `EndsWith`, `Contains`, `IsNull`, `IsNotNull`, `_In([...])`,
`IdEq(valor)`. Funções de projeção: `Year`, `Month`, `Day`, `Hour`,
`Minute`, `Second`, `Upper`, `Lower`, `Concat`, `Length`, `Substring`,
`Position`, `Sum`, `Min`, `Max`, `Avg`, `Count`.

Queries são **polimórficas**: `Find<TMamifero>` traz também `TCachorro`
e `TGato`, em qualquer estratégia de herança.

## Atualização e transação

```pascal
Cliente := Manager.Find<TCliente>(Id);
Cliente.Email := 'novo@x.com';
Manager.Flush(Cliente);   // prefira o overload de objeto único
```

`Flush` sem argumento varre todo o cache do manager — lento com muitos
objetos. Só as colunas alteradas entram no UPDATE.

```pascal
Trans := Manager.Connection.BeginTransaction;
try
  Manager.Save(A);
  Manager.Save(B);
  Trans.Commit;
except
  Trans.Rollback;
  raise;
end;
```

Transações aninhadas: só o commit/rollback mais externo chega ao banco.

## Armadilhas frequentes

- **Entidade "não existe" em runtime.** O linker do Delphi remove classes
  não referenciadas. Adicione `RegisterEntity(TMinhaClasse);` na seção
  `initialization` da unit — obrigatório em servidores XData.
- **Dialeto/schema não registrado.** Sem `Aurelius.Sql.XXX` no uses o
  Aurelius não sabe gerar SQL; sem `Aurelius.Schema.XXX` o
  `UpdateDatabase`/`ValidateDatabase` não consegue ler o schema atual.
- **Atributo em field E em property.** Aurelius aceita um ou outro, nunca
  os dois para o mesmo membro. Prefira **fields** (necessário para
  `Proxy<T>`).
- **Automapping não mapeia properties**, só fields; não mapeia herança
  (declare explicitamente) nem enumerações (salvo config global).
- **Coluna NOT NULL nova em tabela existente** vira *warning* no
  `UpdateDatabase` e pode falhar com dados existentes — crie como
  nullable (`Nullable<T>`) e ajuste depois.
- **`UpdateDatabase` nunca dropa nada.** Mudança de tipo, tamanho,
  nulidade ou PK vira *Error*: tem que ser feita manualmente no banco.
- **Acessar lazy depois de liberar o manager** → AV. Ou carregue eager,
  ou mantenha o manager vivo, ou use `OwnsObjects := False` com cuidado.
- **`Update` em objeto transiente grava TODAS as colunas** (não há
  snapshot para diff). Se o Id já estiver no manager em outra instância,
  `Update` levanta exceção — use `Merge<T>`.
- **Método `[OnValidate]` ou `[OnInserting]` que nunca dispara.** O Delphi
  não gera RTTI para métodos não publicados. A classe precisa de
  `{$RTTI EXPLICIT METHODS([vcPrivate..vcPublished])}`, senão o Aurelius
  não enxerga o método.
- **`[Required]` em Integer não valida nada** — zero é valor válido. Em
  string, porém, vazia falha. Validação é de aplicação, não de banco:
  para NOT NULL continue usando `[Column(..., [TColumnProp.Required])]`.
- **Filtro global definido mas sem efeito.** Filtros são desabilitados por
  padrão; sem `Manager.EnableFilter('Nome')` nenhuma condição é aplicada.
  E o filtro só afeta SELECT — para insert/update/delete use o
  `TFilterEnforcer`.
- **Projeções + `List`**: só projeções de propriedade (`TProjections.Prop`
  / `Linq['X']`) permitem retornar entidades. Objetos parcialmente
  preenchidos não devem ser usados para update — as colunas ausentes
  seriam apagadas.

## Estilo de código a seguir

- Sempre `try..finally` em torno de `TObjectManager`, `TDatabaseManager`
  e das listas retornadas por `List`.
- Nomear a variável do manager de forma que fique claro seu escopo de
  vida; um manager por unidade de trabalho, não um global eterno.
- Usar `Nullable<T>` para toda coluna que aceita NULL; testar com
  `.IsNull` e limpar com `:= SNull`.
- Preferir `CascadeTypeAllButRemove` em many-to-one e
  `CascadeTypeAllRemoveOrphan` em coleções de itens que só existem
  dentro do pai (itens de nota, por exemplo).
