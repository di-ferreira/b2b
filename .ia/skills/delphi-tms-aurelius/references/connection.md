# Conexão e schema

## IDBConnection

Declarada em `Aurelius.Drivers.Interfaces`. É a representação de baixo
nível da conexão — tudo no Aurelius (object manager, database manager)
consome essa interface. Duas formas de obtê-la: **adapter** (envolve um
componente de acesso a dados existente) ou **driver nativo** (acesso
direto pelas libs do banco).

## Adapters de componentes

```pascal
uses Aurelius.Drivers.FireDac;

Conn := TFireDacConnectionAdapter.Create(FDConnection1, False);
```

Construtores sobrecarregados (iguais para todos os adapters):

```pascal
constructor Create(AConnection: T; AOwnsConnection: boolean);
constructor Create(AConnection: T; ASQLDialect: string; AOwnsConnection: boolean);
constructor Create(AConnection: T; OwnedComponent: TComponent);
constructor Create(AConnection: T; ASQLDialect: string; OwnedComponent: TComponent);
```

- `AOwnsConnection = False`: o componente adaptado sobrevive à liberação
  da interface. Use quando o componente já existe na aplicação.
- `AOwnsConnection = True`: o componente é destruído junto. Use quando
  você criou o componente só para o Aurelius.
- `OwnedComponent`: destrói esse componente (tipicamente um `TDataModule`)
  quando a interface é liberada — útil para criar N instâncias de um data
  module configurado em design-time (multi-thread).

```pascal
DM := TConnectionDataModule.Create(nil);
Conn := TDBExpressConnectionAdapter.Create(DM.SQLConnection1, DM);
// ao liberar Conn, o data module inteiro é destruído
```

Recuperar o componente original:

```pascal
FDConn := (Conn as IDBConnectionAdapter).AdaptedConnection as TFDConnection;
```

| Tecnologia | Classe do adapter | Unit | Componente |
|---|---|---|---|
| FireDac | `TFireDacConnectionAdapter` | `Aurelius.Drivers.FireDac` | `TFDConnection` |
| UniDac | `TUniDacConnectionAdapter` | `Aurelius.Drivers.UniDac` | `TUniConnection` |
| dbExpress | `TDBExpressConnectionAdapter` | `Aurelius.Drivers.dbExpress` | `TSQLConnection` |
| dbGo (ADO) | `TDbGoConnectionAdapter` | `Aurelius.Drivers.dbGo` | `TADOConnection` |
| IBX | `TIBExpressConnectionAdapter` | `Aurelius.Drivers.IBExpress` | `TIBDatabase` |
| IBObjects | `TIBObjectsConnectionAdapter` | `Aurelius.Drivers.IBObjects` | `TIBODatabase` |
| FIBPlus | `TFIBPlusConnectionAdapter` | `Aurelius.Drivers.FIBPlus` | `TFIBDatabase` |
| UIB | `TUIBConnectionAdapter` | `Aurelius.Drivers.UIB` | `TUIBDatabase` |
| ZeosLib | `TZeosLibConnectionAdapter` | `Aurelius.Drivers.ZeosLib` | `TZConnection` |
| AnyDac | `TAnyDacConnectionAdapter` | `Aurelius.Drivers.AnyDac` | `TADConnection` |
| ElevateDB | `TElevateDBConnectionAdapter` | `Aurelius.Drivers.ElevateDB` | `TEDBDatabase` |
| NexusDB | `TNexusDBConnectionAdapter` | `Aurelius.Drivers.NexusDB` | `TnxDatabase` |
| AbsoluteDB | `TAbsoluteDBConnectionAdapter` | `Aurelius.Drivers.AbsoluteDB` | `TABSDatabase` |
| DOA | `TDoaConnectionAdapter` | `Aurelius.Drivers.Doa` | `TOracleSession` |
| SQL-Direct | `TSQLDirectConnectionAdapter` | `Aurelius.Drivers.SqlDirect` | `TSDDatabase` |
| NativeDB | `TNativeDBConnectionAdapter` | `Aurelius.Drivers.NativeDB` | `TASASession` |
| RemoteDB | `TRemoteDBConnectionAdapter` | `Aurelius.Drivers.RemoteDB` | `TRemoteDBDatabase` |
| SQLite nativo | `TSQLiteNativeConnectionAdapter` | `Aurelius.Drivers.SQLite` | — |

dbGo (ADO) só é oficialmente suportado contra SQL Server.

SQLite nativo é diferente: recebe o nome do arquivo, e FKs são por
conexão (não por banco):

```pascal
Ad := TSQLiteNativeConnectionAdapter.Create('C:\dados\meu.sdb');
Ad.EnableForeignKeys;      // ou DisableForeignKeys
Conn := Ad;
```

## Drivers nativos

Sem componente de terceiros; connection string no formato
`Param=Valor;Param=Valor`.

| Banco | Driver | Classe | Unit |
|---|---|---|---|
| SQL Server | `MSSQL` | `TMSSQLConnection` | `Aurelius.Drivers.MSSQL` |
| SQLite | `SQLite` | `TSQLiteConnection` | `Aurelius.Drivers.SQLite` |

```pascal
Conn := TMSSQLConnection.Create(
  'Server=.\SQLEXPRESS;Database=Northwnd;TrustedConnection=True');

Conn := TSQLiteConnection.Create(
  'Database=C:\dados\meu.sqlite;EnableForeignKeys=True');
```

Parâmetros SQLite: `Database` (caminho ou `:memory:`), `EnableForeignKeys`.

Parâmetros MSSQL: `Server`, `Database`, `UserName`, `Password`,
`TrustedConnection`, `MARS`, `OdbcAdvanced`, `LoginTimeout`, `Driver`
(deixe vazio para o Aurelius escolher o mais recente).

Com driver nativo, dialeto e schema importer são implícitos — não precisa
adicionar as units `Aurelius.Sql.*` / `Aurelius.Schema.*`.

## TAureliusConnection

Componente RAD que encapsula ambos os modos. Duplo clique abre o editor
de conexão (modo adapter ou modo driver, com botão "Test Connection").

```pascal
// modo adapter
AureliusConnection1.AdaptedConnection := FDConnection1;
AureliusConnection1.AdapterName := 'FireDac';
AureliusConnection1.SQLDialect := 'PostgreSQL';

// modo driver
AureliusConnection1.DriverName := 'MSSQL';
AureliusConnection1.Params.Values['Server'] := '.\SQLEXPRESS';
AureliusConnection1.Params.Values['Database'] := 'NORTHWND';
AureliusConnection1.Params.Values['TrustedConnection'] := 'True';

Conn := AureliusConnection1.CreateConnection;
```

Cada `CreateConnection` cria uma **nova** `IDBConnection`; em modo adapter
ele clona o *owner* do componente adaptado (o data module inteiro), e o
clone é destruído quando a interface é liberada. Para uma conexão global
única, chame `CreateConnection` uma vez e guarde a interface.

O componente tem ainda o item de menu "Generate entities from database..."
(botão direito), que faz engenharia reversa e gera a unit com as classes
mapeadas. Opções relevantes do diálogo: máscara de nome (`T%s`), camel
case, remover underline, singularizar; fetch mode e cascade padrão de
associações; `Generate Dictionary`; `Register Entities` (gera
`RegisterEntity` na `initialization` — importante para XData);
`Don't use Nullable<T>`. Alternativa mais poderosa: TMS Data Modeler.

Há também o wizard File > New > Other > TMS Business > "TMS Aurelius
Connection", que cria um data module pré-configurado com
`CreateConnection` de classe.

## Dialetos SQL

O dialeto precisa estar **registrado** — o Aurelius não linka o que você
não usa. Basta pôr a unit no uses de qualquer unit do projeto.

| Dialeto | Identificador | Unit |
|---|---|---|
| Firebird (2.x) | `Firebird` | `Aurelius.Sql.Firebird` |
| Firebird 3+ | `Firebird3` | `Aurelius.Sql.Firebird3` |
| Interbase | `Interbase` | `Aurelius.Sql.Interbase` |
| SQL Server | `MSSQL` | `Aurelius.Sql.MSSQL` |
| MySQL | `MySQL` | `Aurelius.Sql.MySql` |
| PostgreSQL | `PostgreSQL` | `Aurelius.Sql.PostgreSQL` |
| Oracle | `Oracle` | `Aurelius.Sql.Oracle` |
| SQLite | `SQLite` | `Aurelius.Sql.SQLite` |
| DB2 | `DB2` | `Aurelius.Sql.DB2` |
| SQL Anywhere | `SqlAnywhere` | `Aurelius.Sql.SqlAnywhere` |
| NexusDB | `NexusDB` | `Aurelius.Sql.NexusDB` |
| ElevateDB | `ElevateDB` | `Aurelius.Sql.ElevateDB` |
| AbsoluteDB | `AbsoluteDB` | `Aurelius.Sql.AbsoluteDB` |

Diferença Firebird × Firebird3: o segundo usa campos boolean e identity
por padrão.

O adapter normalmente detecta o dialeto sozinho (o FireDAC pela
`DriverID`, por exemplo). Quando não dá (ODBC, componentes genéricos),
informe explicitamente:

```pascal
Conn := TDBExpressConnectionAdapter.Create(SQLConnection1, 'MSSQL', False);
```

### Configurando o dialeto

```pascal
uses Aurelius.Sql.Register, Aurelius.Sql.MSSQL;

(TSQLGeneratorRegister.GetInstance.GetGenerator('MSSQL')
  as TMSSQLSQLGenerator).UseBoolean := True;
```

Opções comuns a todos:

- `EnforceAliasMaxLength` — limita o tamanho dos aliases de campo ao
  máximo do banco (evita erro, principalmente em Firebird). Existe em
  False só por compatibilidade; **deve ser True**.
- `UseBoolean` — False (padrão geral): boolean vira `CHAR(1)`; True: vira
  `BIT`/`TINYINT`.

Específicos:

- MSSQL `WorkaroundInsertTriggers` (default True) — usa `SET NOCOUNT ON`
  + tabela temporária para recuperar valores identity. Pode ser desligado
  para ganhar performance ou quando os identities passam de 32 bits.
- Firebird3 `UseBoolean` (default True) e `UseIdentity` (default True) —
  desligar os dois faz o Firebird3 se comportar como Firebird 2.x.

## Schema importers

Necessários para `UpdateDatabase` e `ValidateDatabase` (engenharia
reversa). Também precisam ser registrados no uses:
`Aurelius.Schema.XXX`, onde XXX é o nome do dialeto —
`Aurelius.Schema.Firebird`, `Aurelius.Schema.MSSQL`,
`Aurelius.Schema.MySql`, `Aurelius.Schema.PostgreSQL`,
`Aurelius.Schema.Oracle`, `Aurelius.Schema.SQLite`,
`Aurelius.Schema.Interbase`, `Aurelius.Schema.DB2`,
`Aurelius.Schema.SqlAnywhere`, `Aurelius.Schema.NexusDB`,
`Aurelius.Schema.ElevateDB`, `Aurelius.Schema.AbsoluteDB`.

Com driver nativo é implícito.

## TDatabaseManager

Unit `Aurelius.Engine.DatabaseManager`.

```pascal
DBManager := TDatabaseManager.Create(Conn);                     // modelo padrão
DBManager := TDatabaseManager.Create(Conn, MeuMappingExplorer); // outro modelo
```

| Método | O que faz |
|---|---|
| `BuildDatabase` | executa o script completo de criação, sem olhar o que existe (erra se a tabela já existir) |
| `UpdateDatabase` | valida, gera e executa o script de atualização |
| `ValidateDatabase` | só compara e gera o script; retorna True se não houver diferenças |
| `DestroyDatabase` | executa o script de drop completo |

`UpdateDatabase` é **não destrutivo**: mesmo que a validação diga que uma
tabela/coluna com dados precisaria ser removida, o comando não é
executado.

Propriedades: `SQLStatements` (o script gerado, sempre disponível),
`SQLExecutionEnabled` (False faz `UpdateDatabase` se comportar como
`ValidateDatabase`), `UseTransactions` (default False),
`IgnoreConstraintName` (True compara FK/unique pelo conteúdo em vez do
nome — útil quando o banco foi criado por outra ferramenta).

### Resultado da validação

```pascal
property Actions:  TEnumerable<TSchemaAction>;
property Warnings: TEnumerable<TSchemaWarning>;
property Errors:   TEnumerable<TSchemaError>;
property ActionCount, WarningCount, ErrorCount: integer;
```

Todos herdam de `TSchemaMessage` (unit `Aurelius.Schema.Messages`), que
tem a propriedade `Text`.

- **Actions** — diferenças que o manager aplica com segurança: nova
  tabela, nova coluna nullable, nova sequence, novo índice não único,
  remoção de FK ou unique (se o banco suportar).
- **Warnings** — aplicáveis, mas podem falhar conforme os dados: nova
  coluna NOT NULL em tabela existente; nova FK.
- **Errors** — o manager **não** consegue aplicar; ajuste manual no banco:
  mudança de tipo, de nulidade, de tamanho/precisão/escala; mudança de PK;
  remoção de coluna, tabela ou sequence; nova unique key; FK que o banco
  não suporta alterar.

"Error" não significa que a aplicação vai quebrar — significa que o
Aurelius não vai resolver aquilo sozinho.

### Só gerar o script

```pascal
DBManager.SQLExecutionEnabled := False;
DBManager.UpdateDatabase;
for S in DBManager.SQLStatements do
  Writeln(S);
```

## TAureliusDBSchema

Componente não-visual que encapsula um `TDatabaseManager`. Ligue-o a um
`TAureliusConnection`, opcionalmente defina `ModelNames` (vários separados
por vírgula) e chame os mesmos métodos. O objeto interno fica em
`DBManager` para o que não tiver wrapper:

```pascal
AureliusDBSchema1.UpdateDatabase;              // equivale a
AureliusDBSchema1.DBManager.UpdateDatabase;
```

O `TDatabaseManager` interno é criado sob demanda e destruído/recriado
quando `Connection` ou `ModelNames` mudam.
