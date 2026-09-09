# Consultas (TCriteria / Linq / Projections)

```pascal
uses
  Aurelius.Criteria.Base,          // TCriteria, TOrder — sempre necessário
  Aurelius.Criteria.Linq,          // Linq[...]
  Aurelius.Criteria.Projections;   // TProjections
```

## Criando e recuperando

```pascal
Crit := Manager.CreateCriteria(TCliente);      // TCriteria (não genérico)
Crit := Manager.Find<TCliente>;                // TCriteria<T> — recomendado
Crit := Manager.CreateCriteria<TCliente>;      // idem
```

| Método | Retorno | Uso |
|---|---|---|
| `List` / `List<T>` | `TList<T>` | lista de entidades (libere a lista) |
| `UniqueResult` / `UniqueResult<T>` | entidade ou `nil` | resultado único; `EResultsNotUnique` se houver mais de um objeto distinto |
| `ListValues` | `TObjectList<TCriteriaResult>` (`OwnsObjects=True`) | consultas com projeções |
| `UniqueValue` | `Variant` | projeção única (ex.: um `Sum`) |
| `Open` | `ICriteriaCursor<T>` | fetch sob demanda |

Se o criteria veio do `Find` não genérico, chame `List<T>`; se veio de
`Find<T>`, chame `List`.

**Ciclo de vida do TCriteria:** ele se autodestrói ao recuperar resultados
(`List`, `ListValues`, `UniqueResult`, `UniqueValue`) ou quando o cursor
do `Open` é liberado. Não libere manualmente. Se precisar mantê-lo vivo
para adicionar filtros depois, `AutoDestroy := False` — e aí **você** tem
que liberá-lo.

## Cursor (fetch-on-demand)

Mantém a query aberta e busca objetos sob demanda; bom para volumes
grandes e para alimentar `TAureliusDataset`.

```pascal
Cursor := Manager.Find<TCliente>.Open;
while Cursor.Next do
  Fazer(Cursor.Get);

// ou, direto:
for Cliente in Manager.Find<TCliente>.Open do
  Fazer(Cliente);
```

```pascal
ICriteriaCursor = interface
  function Next: boolean;
  function Fetch: TObject;
  function BaseClass: TClass;
  function ResultClass: TClass;
end;

ICriteriaCursor<T: class> = interface(ICriteriaCursor)
  function Get: T;
  function GetEnumerator: TEnumerator<T>;
end;
```

O cursor abre em posição indefinida: **chame `Next` antes de qualquer
fetch**. Se o primeiro `Next` retornar False, não há registros. Nunca
chame `Fetch` depois de um `Next` que retornou False. O cursor é
interface (contagem de referência) e destrói o `TCriteria` junto.

## Filtros com Linq

`Where` e `Add` são equivalentes; múltiplas chamadas combinam com AND.

```pascal
Results := Manager.Find<TCliente>
  .Where(Linq['Nome'] = 'Maria')
  .List;

Results := Manager.Find<TCliente>
  .Where((Linq['Pais'] = 'BR') and (Linq['Idade'] = 30))   // parênteses obrigatórios
  .List;
```

Formas equivalentes de escrever a mesma condição:

```pascal
Linq['Idade'] > 30
Linq.GreaterThan('Idade', 30)
TSimpleExpression.Create(TPropertyProjection.Create('Idade'), 30, eoGreater)
```

| Condição | Operador | Métodos |
|---|---|---|
| Igual | `=` | `Equals`, `Eq` |
| Maior | `>` | `GreaterThan`, `Gt` |
| Maior ou igual | `>=` | `GreaterOrEqual`, `Ge` |
| Menor | `<` | `LessThan`, `Lt` |
| Menor ou igual | `<=` | `LessOrEqual`, `Le` |
| LIKE | — | `Like('M%')` — o `%` é seu |
| LIKE case-insensitive | — | `ILike('m%')` |
| Nulo | — | `IsNull`, `IsNotNull` |
| Começa/termina/contém | — | `StartsWith`, `EndsWith`, `Contains` |
| IN | — | `_In([v1, v2])` (string, inteiro ou enum) |
| Id igual | — | `Linq.IdEq(1)` |

Id composto com `IdEq`:

```pascal
Id := VarArrayCreate([0, 1], varVariant);
Id[0] := 'Silva';
Id[1] := 'João';
Pessoa := Manager.Find<TPessoa>.Where(Linq.IdEq(Id)).UniqueResult;
```

### SQL cru em condição

```pascal
.Where(Linq.Sql('{Nome} = ''Maria'''))            // {Prop} → alias.coluna
.Where(Linq.Sql('{c.Nome} = ''Brasil'''))         // com alias de associação
```

Sem chaves você teria que saber o alias real (`A.NOME`), o que é frágil
quando há JOINs. Com subcriteria, o contexto das chaves é a classe da
subcriteria.

Parâmetros (até dois), marcados por `?`, com o tipo no genérico:

```pascal
.Where(Linq.Sql<TSexo>('{Sexo} IN (?)', TSexo.sxFeminino))

.Where(Linq.Sql<TDate, TDate>(
  '{Emissao} IS NULL OR (({Emissao} > ?) AND ({Emissao} < ?))',
  EncodeDate(1999,2,10), EncodeDate(2000,8,30)))
```

O Aurelius **não** converte a sintaxe do SQL cru para o dialeto — só
resolve aliases e parâmetros.

### Comparando projeções

`Linq['Nome']` já é uma projeção, então dá para comparar duas:

```pascal
.Where(Linq['DataCancelamento'] > Linq['DataEnvio'])
.Where(Linq['DataCancelamento'].Year = Linq['DataEnvio'].Year)
```

## Associações em consultas

Três formas, do mais simples ao mais explícito:

**Auto alias** (padrão desde a 5.6) — só use pontos:

```pascal
.Where(Linq['Cliente.Nome'].StartsWith('M'))
.Where(Linq['Cliente.Pais.Nome'] = 'Brasil')
```

**Alias explícito** — `CreateAlias` devolve o criteria **original**, então
o contexto continua sendo a classe raiz e você prefixa com o alias:

```pascal
Manager.Find<TOrcamento>
  .CreateAlias('Cliente', 'ct')
  .CreateAlias('ct.Pais', 'pa')
  .Where(Linq['pa.Nome'] = 'Brasil')
  .List;
```

**SubCriteria** — devolve um criteria **novo**, cujo contexto é a classe
associada; por isso o `List<T>` no final precisa do tipo:

```pascal
Manager.Find<TNota>
  .SubCriteria('Cliente')
    .Where(Linq['Nome'].Like('M%'))
    .List<TNota>;
```

Podem ser aninhados e misturados livremente.

### Forçando eager (contra N+1)

```pascal
.FetchEager('Cliente')
.FetchEager('Cliente.Pais')
// ou:
.CreateAlias('Cliente', 'ct', TFetchMode.Eager)
.SubCriteria('Cliente', TFetchMode.Eager)
```

Mesmo que a associação esteja mapeada como lazy, isso gera um JOIN único
em vez de N SELECTs.

## Ordenação

```pascal
.OrderBy('Nome')
.OrderBy('c.Nome', False)             // False = descendente
.AddOrder(TOrder.Asc('Nome'))
.AddOrder(TOrder.Desc('c.Nome'))
.OrderBySql('{c.Nome} DESC NULLS FIRST')
```

Para ordenar por expressão complexa, dê um alias à projeção e ordene pelo
alias (alguns bancos não aceitam a expressão no ORDER BY).

## Projeções

Use `Select` (ou `SetProjections`, idênticos) para retornar valores
calculados em vez de entidades.

```pascal
Total := Manager.Find<TNota>
  .Select(TProjections.Count('Id'))
  .Where(Linq['Emissao'].Year = 2013)
  .UniqueValue;
```

Só **uma** projeção por query — para várias, use `ProjectionList`:

```pascal
Results := Manager.Find<TOrcamento>
  .CreateAlias('Cliente', 'c')
  .Select(TProjections.ProjectionList
    .Add(TProjections.Sum('Valor').As_('SomaValor'))
    .Add(TProjections.Group('c.Nome'))
    )
  .Where(Linq['c.Nome'].Like('M%'))
  .AddOrder(TOrder.Asc('SomaValor'))
  .ListValues;

Soma := Results[0].Values['SomaValor'];
Nome := Results[0].Values[1];        // sem alias → acesso por índice
```

`TCriteriaResult`:

```pascal
TCriteriaResult = class
public
  function HasProp(PropName: string): boolean;
  property PropNames[Index: integer]: string;
  property Values[Index: integer]: Variant; default;
  property Values[PropName: string]: Variant; default;
  property Count: integer;
end;
```

`TCriteriaResult` **não** é gerenciado pelo manager. Com `ListValues` a
lista já tem `OwnsObjects = True` (basta liberar a lista); com
`UniqueValue` ou `Open`, destrua você mesmo.

### Catálogo de projeções

**Agregações:** `Sum`, `Min`, `Max`, `Avg`, `Count`
**Agrupamento:** `Group` (não existe cláusula GROUP BY separada — basta
adicionar a projeção agrupada)
**Aritmética:** `+`, `-`, `*`, `/` (ou `Linq.Add/Subtract/Multiply/Divide`).
A divisão segue semântica Pascal: `7 / 5` = 1.4 em qualquer banco.
**Data/hora:** `Year`, `Month`, `Day`, `Hour`, `Minute`, `Second`
**String:** `Upper`, `Lower`, `Concat`, `Length`, `Substring(inicio, tam)`
(1-based), `Position(sub)` (1-based, 0 se não achar), `ByteLength`
**Condicional:** `TProjections.Condition(cond, seVerdadeiro, seFalso)` →
CASE WHEN
**Constantes:** `Linq.Literal<T>(v)` (embutido no SQL) vs `Linq.Value<T>(v)`
(vira parâmetro)
**Alias:** `.As_('Nome')` ou `TProjections.Alias(proj, 'Nome')`
**SQL cru:** `TProjections.Sql<TipoRetorno>('{id} * 2').As_('Dobro')`
**Função de banco:** `Linq.SqlFunction('unaccent', nil, Linq['Nome'])`

Funções não conhecidas pelo Aurelius precisam ser registradas no dialeto:

```pascal
uses Aurelius.Sql.Interfaces, Aurelius.Sql.Register, Aurelius.Sql.Functions;

TSQLGeneratorRegister.GetInstance.GetGenerator('POSTGRESQL')
  .RegisterFunction('unaccent', TSimpleSQLFunction.Create('unaccent'));
```

Concatenação com NULL não é consistente entre bancos (Oracle trata NULL
como string vazia).

### Limitando colunas e ainda retornando entidades

A projeção de propriedade é a **única** que permite continuar usando
`List`/`UniqueResult` e receber entidades:

```pascal
Clientes := Manager.Find<TCliente>
  .Select(TProjections.ProjectionList
    .Add(Linq['Nome'])
    .Add(Linq['Nascimento']))
  .List;    // TCliente com apenas essas propriedades preenchidas
```

**Cuidado:** essas entidades estão parcialmente preenchidas. Um update
completo a partir delas apagaria as colunas não carregadas.

Também dá para projetar subpropriedades de associações combinando com
`FetchEager`.

## Polimorfismo

Consultas respeitam a hierarquia: `Find<TMamifero>` retorna instâncias de
`TMamifero`, `TCachorro`, `TGato` — e exclui `TAve` — independentemente da
estratégia de herança.

## Paginação

```pascal
.Skip(Pagina * TamPagina).Take(TamPagina)
```

`Take(0)` → vazio. `Take(-1)` → equivale a não usar Take. Valores ≤ -2 são
inválidos. `Skip` negativo é inválido. Paginar sem `OrderBy` raramente faz
sentido.

## Duplicatas

Filtrar por many-valued association pode repetir a entidade pai (é um
JOIN, como em SQL):

```pascal
Manager.Find<TNota>
  .CreateAlias('Itens', 'i')
  .Add(Linq['i.Preco'] = 20)
  .RemovingDuplicatedEntities
  .List;
```

A deduplicação acontece no **cliente**, então tem custo com muitos
registros.

## Clone e Refreshing

```pascal
Base := Manager.Find<TCliente>.Where(Linq['Nome'] = 'Maria');
Outra := Base.Clone;
Outra.OrderBy('Id');
```

Por padrão, entidades já em cache **não** são atualizadas pelo resultado
da query. Para forçar a releitura dos valores do banco:

```pascal
.Refreshing
```

Em associações lazy, `Refreshing` atualiza o proxy mas não carrega na
hora; se quiser os itens de uma lista lazy realmente atualizados, itere e
chame `Manager.Refresh` em cada um.
