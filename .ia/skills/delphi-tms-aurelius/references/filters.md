# Filtros globais

Permitem aplicar uma condição SQL a várias entidades de uma vez — o caso
clássico é multitenancy e soft delete. A condição entra no WHERE de todo
SELECT daquelas entidades, inclusive quando elas aparecem como associação.

## Exemplo completo

```pascal
  [Entity, Automapping]
  [FilterDef('Multitenant', '{TenantId} = :tenantId')]
  [FilterDefParam('Multitenant', 'tenantId', TypeInfo(string))]
  [Filter('Multitenant')]
  TProduto = class
  private
    FId: Integer;
    FNome: string;
    FTenantId: string;
  public
    property Id: Integer read FId write FId;
    property Nome: string read FNome write FNome;
    property TenantId: string read FTenantId write FTenantId;
  end;
```

```pascal
Manager.EnableFilter('Multitenant')
  .SetParam('tenantId', 'microsoft');
Produtos := Manager.Find<TProduto>.OrderBy('Nome').List;
```

SQL gerado:

```sql
SELECT A.NAME, A.ID, A.TENANT_ID
  FROM PRODUCT A
  WHERE A.TENANT_ID = :p0
  ORDER BY A.NAME;
-- :p0 = 'microsoft'
```

## Definindo o filtro

`FilterDef(nome, condicao)` — o segundo parâmetro é opcional e vale como
condição padrão para as entidades que não declararem uma própria.

```pascal
  [FilterDef('Deleted', '{Deleted} = 0')]
```

Referencie **membros da classe** entre chaves `{ }`; o Aurelius traduz
para `alias.coluna`. Parâmetros usam prefixo `:` e **cada um** exige um
`FilterDefParam(nomeFiltro, nomeParam, TypeInfo(Tipo))`.

**Definições de filtro são globais ao modelo.** Não declare dois
`FilterDef` com o mesmo nome, nem em entidades diferentes.

## Aplicando às entidades

```pascal
  [Filter('Multitenant')]
  [Filter('Deleted')]
  TProduto = class ...

  [Filter('Multitenant')]
  TCliente = class ...
```

Cada entidade só sofre os filtros que declarar.

Dá para sobrescrever a condição por entidade:

```pascal
  [Filter('Multitenant', '{OutroTenantId} = :tenantId')]
  TOutraClasse = class ...
```

A condição sobrescrita tem que usar os mesmos parâmetros da definição.

**Com herança, aplique o filtro apenas na classe raiz da hierarquia.**
Filtro em classe descendente pode trazer resultados errados quando essas
classes forem carregadas como objetos associados.

## Habilitando

Filtros são **sempre desabilitados por padrão** — sem `EnableFilter`
nenhuma condição é aplicada. Isso é escopo de `TObjectManager`.

```pascal
Manager.EnableFilter('Deleted');

Manager.EnableFilter('Multitenant')
  .SetParam('tenantId', 'microsoft');

if Manager.FilterEnabled('Multitenant') then
  Manager.DisableFilter('Multitenant');
```

## Filter enforcer

O filtro só afeta **SELECT**. Insert, update e delete continuam livres —
nada impede gravar um registro com o tenant errado.

O `TFilterEnforcer` (`Aurelius.Mapping.FilterEnforcer`) fecha essa brecha:

```pascal
uses {...}, Aurelius.Mapping.FilterEnforcer;

Enforcer := TFilterEnforcer.Create('Multitenant', 'tenantId', 'FTenantId');
Enforcer.Activate(TMappingExplorer.Default);
...
Enforcer.Deactivate(TMappingExplorer.Default);
Enforcer.Free;
```

Parâmetros do construtor: nome do filtro, nome do parâmetro da condição,
nome do membro da classe (field ou property) a ser conferido contra o
valor do parâmetro. Na ativação você informa a qual mapping explorer
(modelo) ele se aplica.

O enforcer assina eventos do modelo. Antes de inserir, atualizar ou
deletar ele verifica:

1. se o filtro está ativo;
2. se o valor do membro (`FTenantId`) bate com o valor do parâmetro
   (`tenantId`).

Falhando o item 2, é levantada exceção. Para preencher automaticamente em
vez de reclamar quando o membro está vazio:

```pascal
Enforcer.AutoComplyOnInsert := True;
Enforcer.AutoComplyOnUpdate := True;
```

Com isso, inserir sem informar `TenantId` faz o enforcer gravar o valor do
parâmetro do filtro ativo.
