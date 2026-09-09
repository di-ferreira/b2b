# Data Validation

Unit dos atributos: `Aurelius.Validation.Attributes`.
Interfaces: `Aurelius.Validation.Interfaces`.

Validações são declarativas: você anota o mapeamento e o Aurelius se
recusa a persistir a entidade em estado inválido, levantando
`EEntityValidationException`.

```pascal
uses {...}, Aurelius.Validation.Attributes;

type
  [Entity, Automapping]
  TCliente = class
  strict private
    FId: Integer;
    [Required, MaxLength(20)]
    FNome: string;
  public
    property Id: Integer read FId write FId;
    property Nome: string read FNome write FNome;
  end;
```

Ao tentar salvar com nome maior que 20:

```
EEntityValidationException: Validation failed for entity of type
"Entities.Customer.TCustomer": Field FName must have no more than 20 character(s)
```

**Importante:** a validação é de **nível de aplicação**, não do banco.
Para definir tamanho e nulidade no banco você continua usando os
atributos de mapeamento (`Column`, `TColumnProp.Required`).

## Validadores nativos

| Atributo | Efeito |
|---|---|
| `[Required]` | exige um valor válido |
| `[MaxLength(30)]` | tamanho máximo de string |
| `[MinLength(5)]` | tamanho mínimo de string |
| `[Range(1, 10)]` | faixa de valores numéricos |
| `[EmailAddress]` | string tem que ser e-mail válido |
| `[RegularExpression('^[0-9]{5}$')]` | string casa com a regex |
| `[ItemRequired]` | aplica `Required` a cada item de lista/array |
| `[ItemMaxLength(5)]` | aplica `MaxLength` a cada item |
| `[ItemMinLength(2)]` | aplica `MinLength` a cada item |

Pegadinhas do `Required`:

```pascal
  [Required] FTaxa: Integer;              // NUNCA falha — 0 é valor válido
  [Required] FNascimento: Nullable<TDateTime>;   // falha só se for null
  [Required] FNome: string;               // string vazia FALHA
```

String vazia é a exceção: não conta como valor.

`RegularExpression` considera string vazia válida por padrão. Para exigir
que a vazia também passe pela regex, passe `False` no segundo parâmetro
(`ValidateEmptyString`):

```pascal
  [RegularExpression('^[0-9]{5}$', False)]   // não aceita string vazia
  FCep: string;
```

`ItemRequired` em `TArray<string>`/`TList<string>` garante strings não
vazias; em lista de objetos, garante itens não nil.

## Validadores de entidade (`OnValidate`)

Para regras que dependem de mais de um campo, marque métodos com
`[OnValidate]`:

```pascal
  {$RTTI EXPLICIT METHODS([vcPrivate..vcPublished])}
  TCliente = class
    [OnValidate]
    function ChecarNascimento: IValidationResult;
    [OnValidate]
    function ChecarNome(Context: IValidationContext): IValidationResult;
  end;
```

**Atenção:** o Delphi não gera RTTI para métodos não publicados. Sem a
diretiva `{$RTTI EXPLICIT METHODS([vcPrivate..vcPublished])}` na classe, o
Aurelius **não enxerga os métodos** e eles nunca são chamados.

O método sempre retorna `IValidationResult` e recebe ou um
`IValidationContext` ou nenhum parâmetro:

```pascal
function TCliente.ChecarNascimento: IValidationResult;
begin
  Result := TValidationResult.Create;
  if FNascimento.IsNull then Exit;

  if YearOf(FNascimento) < 1899 then
    Result.Errors.Add(TValidationError.Create(
      'Não aceitamos nascidos no século XIX'));
end;
```

Vários métodos `[OnValidate]` podem coexistir — todos são executados, na
ordem de declaração na classe.

**Ordem geral:** os validadores de membro rodam primeiro. Os validadores
de entidade só rodam **se não houver nenhum erro** de membro.

## Mensagens de erro

Cada validador tem mensagem padrão (`Field FEmail is not a valid e-mail
address`). Duas formas de customizar:

**`DisplayName`** — troca o nome do membro em todas as mensagens dele:

```pascal
  [EmailAddress, DisplayName('e-mail')]
  FEmail: string;
  // → Field e-mail is not a valid e-mail address
```

**Mensagem completa** — todo validador nativo aceita um parâmetro extra:

```pascal
  [DisplayName('e-mail')]
  [EmailAddress('Informe um e-mail válido para o campo "%0:s"')]
  FEmail: string;
  // → Informe um e-mail válido para o campo "e-mail"
```

`%0:s` é o nome do membro (válido em todos). Validadores com mais
parâmetros expõem mais: `Range` dá mínimo em `%1:s` e máximo em `%2:s`.

## Tratando a falha

`EEntityValidationException` aborta a operação de persistência. Na maioria
dos casos basta deixar propagar. Para inspecionar:

- `Entity` — a instância que falhou;
- `Results` — lista de `IManagerValidationResult`, cada um com `Errors`.

```pascal
try
  SalvarCliente;
except
  on E: EEntityValidationException do
  begin
    WriteLn(Format('Validação falhou para %s:', [E.Entity.ClassName]));
    for ValidationResult in E.Results do
      for Error in ValidationResult.Errors do
        WriteLn('  ' + Error.ErrorMessage);
  end;
end;
```

Saída típica com três validações quebradas:

```
Validation failed for entity TCustomer:
  Field FName must have no more than 20 character(s)
  Field FEmail is not a valid e-mail address
  Values must be 1 up to 10 for field class rate
```

## Ligar/desligar e validar na mão

```pascal
Manager.ValidationsEnabled := False;   // desliga (ex.: performance)
Manager.Save(Cliente);                 // sem validação

Manager.Validate(MinhaEntidade);       // valida sem persistir
```

## Validador customizado

Implemente `IValidator`:

```pascal
uses {...}, Aurelius.Validation.Interfaces;

type
  TMeuValidator = class(TInterfacedObject, IValidator)
  public
    function Validate(const Value: TValue;
      Context: IValidationContext): IValidationResult;
  end;

function TMeuValidator.Validate(const Value: TValue;
  Context: IValidationContext): IValidationResult;
begin
  if EhValido(Value) then
    Result := TValidationResult.Success
  else
    Result := TValidationResult.Failed(
      Format(MensagemErro, [Context.DisplayName]));
end;
```

E crie o atributo herdando de `ValidationAttribute`, sobrescrevendo
`GetValidator`:

```pascal
  MeuDadoAttribute = class(ValidationAttribute)
  strict private
    FValidator: IValidator;
  public
    constructor Create;
    function GetValidator: IValidator; override;
  end;

constructor MeuDadoAttribute.Create;
begin
  inherited Create;
  FValidator := TMeuValidator.Create;
end;

function MeuDadoAttribute.GetValidator: IValidator;
begin
  Result := FValidator;
end;
```

Uso: `[MeuDado] FMinhaProp: string;`
