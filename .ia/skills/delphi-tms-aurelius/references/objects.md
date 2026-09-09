# Manipulando objetos (TObjectManager)

Unit: `Aurelius.Engine.ObjectManager`.

O `TObjectManager` é a camada central entre a aplicação e o banco.
Ele faz três coisas que definem todo o comportamento:

- **Identity map** — uma única instância por entidade por manager. Duas
  consultas que trazem a mesma PK retornam a **mesma referência**.
- **Change tracking** — alterações de propriedade são detectadas
  automaticamente; `Flush` persiste o acumulado.
- **Ownership** — por padrão (`OwnsObjects = True`) o manager destrói
  todas as entidades gerenciadas quando é destruído.

```pascal
Manager := TObjectManager.Create(Conn);           // modelo padrão
Manager := TObjectManager.Create(Conn, TMappingExplorer.Get('MeuModelo'));
try
  ...
finally
  Manager.Free;
end;
```

## TAureliusManager

Componente não-visual (`Aurelius.Comp.Manager`) que encapsula um
`TObjectManager`, ligado a um `TAureliusConnection`. Todos os métodos de
persistência são delegados; o objeto interno fica em `ObjManager`:

```pascal
AureliusManager1.Save(Cliente);              // equivalente a
AureliusManager1.ObjManager.Save(Cliente);
```

O `TObjectManager` interno é criado sob demanda. Alterar `Connection` ou
`ModelName` em runtime destrói a instância atual **e todas as entidades
que ela gerencia**.

## Memória

**Persistente (gerenciado):** o manager conhece o objeto — carregado do
banco ou registrado via `Save`, `Update` ou `Merge`.
**Transiente:** o manager não o conhece, exista ou não linha no banco.

Listas de resultado: você libera a **lista**, não as entidades.

```pascal
Results := Manager.Find<TCliente>.Where(Linq['Nome'] = 'X').List;
try
  ...
finally
  Results.Free;   // só o TList
end;
```

Exceção: `ListValues` (projeções) retorna `TObjectList<TCriteriaResult>`
com `OwnsObjects = True` — liberar a lista destrói os itens.

**Posse antecipada.** `Save` só assume a posse se completar sem exceção.
Para garantir a destruição em qualquer cenário:

```pascal
Cliente := TCliente.Create;
Manager.AddOwnership(Cliente);
Manager.Save(Cliente);
```

**Manter objetos vivos após o manager:**

```pascal
Manager.OwnsObjects := False;
Results := Manager.Find<TCliente>.List;
Manager.Free;
// as instâncias em Results continuam válidas — e agora são sua responsabilidade
```

## Salvando

`Save` insere. A entidade não pode ter Id preenchido, salvo com
`TIdGenerator.None`.

```pascal
Cliente := TCliente.Create;
Manager.AddOwnership(Cliente);
Cliente.Nome := 'João Silva';
Manager.Save(Cliente);
```

`SaveOrUpdate` decide sozinho: chama `Update` se houver Id, `Save` se não.

### Com associações

Relacionamento é referência de objeto — nunca escreva a coluna FK.

```pascal
Cliente := Manager.Find<TCliente>(IdCliente);

Nota := TNota.Create;
Manager.AddOwnership(Nota);
Nota.Numero := 1001;
Nota.Cliente := Cliente;      // objeto, não Id
Manager.Save(Nota);
```

Com `CascadeTypeAllButRemove` no `[Association]`, salvar o filho cascateia
para o pai novo — um único `Save` insere os dois.

Coleções com `CascadeTypeAll`: adicione os filhos à lista e salve o pai.
Em mapeamento bidirecional, **preencha também a referência de volta**:

```pascal
Item := TItemNota.Create;
Item.Descricao := 'Produto A';
Item.Nota := Nota;            // back-reference
Nota.Itens.Add(Item);
Manager.Save(Nota);           // insere Nota + itens, com FK correta
```

## Atualizando

```pascal
Cliente := Manager.Find<TCliente>(Id);
Cliente.Email := 'novo@exemplo.com';
Manager.Flush(Cliente);       // prefira sempre o overload de objeto único
```

`Flush` sem argumento percorre todo o cache do manager e persiste tudo que
está sujo — pode ser lento. Só as colunas realmente alteradas entram no
UPDATE, o que evita que dois usuários editando campos diferentes se
sobrescrevam.

**Objeto transiente:** `Manager.Update(Obj)` adota o objeto. Como não há
snapshot do estado original, o próximo `Flush` grava **todas** as
propriedades persistentes, não só as alteradas.

**Merge.** Se o Id já estiver anexado ao manager em outra instância,
`Update` levanta exceção. Use `Merge`, que copia os dados do transiente
para a instância persistente e a retorna:

```pascal
Persistente := Manager.Merge<TCliente>(Transiente);
Manager.Flush;
// Transiente continua transiente — libere você mesmo
```

`Replicate` é idêntico, mas insere um registro novo quando não existe
correspondente no banco, em vez de levantar exceção.

### Associações

Trocar: `Nota.Cliente := OutroCliente; Manager.Flush;` → UPDATE da FK.

Adicionar item: crie, set back-reference, `Lista.Add`, `Flush`.

Remover item da coleção: `Nota.Itens.Remove(Item); Manager.Flush;`
- com `CascadeTypeAll` (sem orphan removal): a FK do item vai a NULL e a
  linha permanece (órfã);
- com `CascadeTypeAllRemoveOrphan`: o item é deletado.

Prefira `CascadeTypeAllRemoveOrphan` quando o filho só faz sentido dentro
do pai (itens de nota, parcelas etc.).

## Buscando

```pascal
Cliente := Manager.Find<TCliente>(Id);      // nil se não existir
Lista   := Manager.Find<TCliente>.List;     // query builder fluente
Lista   := Manager.Find<TCliente>.OrderBy('Nome').Take(10).List;
```

Navegação por associação com notação de ponto (gera JOIN automático):

```pascal
Notas := Manager.Find<TNota>
  .Where(Linq['Cliente.Nome'] = 'Acme')
  .List;

Notas := Manager.Find<TNota>
  .CreateAlias('Cliente', 'c')
  .Where((Linq['c.Cidade'] = 'Rio') and (Linq['c.Ativo'] = True))
  .OrderBy('c.Nome')
  .List;
```

Ao ler uma associação lazy de uma entidade gerenciada, o Aurelius emite um
SELECT na hora — **o manager tem que estar vivo**. Não destrua o manager
enquanto ainda houver referências a entidades cujas associações lazy você
pretende acessar.

## Refresh

`Manager.Refresh(Obj)` recarrega do banco e descarta alterações em
memória. Diferente de `Find`, sempre executa o SELECT.

Associações transientes substituídas em memória **não** são destruídas
pelo `Refresh` — libere-as você. Associados e itens de coleção só são
atualizados se o cascade incluir `TCascadeType.Refresh`.

## Removendo

```pascal
Cliente := Manager.Find<TCliente>(Id);
Manager.Remove(Cliente);      // DELETE
```

O objeto é destruído imediatamente por padrão. `DeferDestruction := True`
o mantém em memória até o manager ser destruído — útil quando ainda há
referências a ele (num dataset ou lista).

Com `TCascadeType.Remove` no cascade, os filhos são deletados junto. Sem
cascade de remoção, ou você remove cada filho explicitamente, ou depende
do `ON DELETE CASCADE` do banco.

## Evict

`Manager.Evict(Obj)` desanexa a entidade sem deletá-la. A partir daí as
alterações deixam de ser rastreadas e o objeto volta a ser transiente —
você passa a ser responsável por liberá-lo, a menos que o reanexe com
`Update`. Associados também são evictados se o cascade incluir
`TCascadeType.Evict`.

## Transações

Controladas pela `IDBConnection`:

```pascal
Trans := Manager.Connection.BeginTransaction;
try
  Manager.Save(Cliente);
  Manager.Save(Nota);
  Trans.Commit;
except
  Trans.Rollback;
  raise;
end;
```

Transações aninhadas são suportadas: commit/rollback das internas não tem
efeito imediato — só a mais externa chega ao banco.

## Concorrência

**Campos alterados.** Por padrão, só as colunas modificadas entram no
UPDATE, o que já reduz colisões.

**Versionamento otimista:**

```pascal
  [Entity, Automapping]
  TCliente = class
  private
    FId: Integer;
    [Version]
    FVersion: Integer;
  ...
```

O Aurelius acrescenta `AND Version = :versaoAntiga` a todo UPDATE/DELETE
da entidade. Se outro usuário gravou nesse meio-tempo, nenhuma linha é
afetada e é levantada `EVersionedConcurrencyControl` — trate refazendo
`Refresh` e repetindo a operação.

## Cached updates e batch

```pascal
Manager.CachedUpdates := True;
Manager.Save(A);
Manager.Flush(B);
Manager.Remove(C);
Manager.ApplyUpdates;    // só aqui o SQL é executado, na ordem
```

`CachedCount` informa quantas ações estão pendentes.

Ressalva: com Id gerado por identity, o INSERT é executado na hora mesmo
com `CachedUpdates` ligado (o Id é necessário para continuar). Com
sequence, o valor é buscado na hora mas o INSERT é adiado.

Batch (menos round-trips):

```pascal
Manager.BatchSize := 100;
Manager.CachedUpdates := True;
// ... várias operações do mesmo tipo ...
Manager.ApplyUpdates;
```

O batch agrupa operações consecutivas que geram o mesmo template SQL —
intercalar insert/update/insert quebra o agrupamento. Suporte nativo nos
drivers Native, FireDAC e UniDAC; nos demais, o Aurelius simula reusando
prepared statements.
