# Eventos server-side, autenticação e autorização

Índice:
1. Eventos: como assinar
2. Catálogo de eventos
3. JWT: conceito e fluxo
4. Login e geração do token
5. TJwtMiddleware
6. Chaves assimétricas (RS256)
7. Atributos de autorização
8. Autorização manual e via eventos

---

## 1. Eventos: como assinar

Os eventos ficam em `TXDataServerModule.Events`, do tipo `TXDataModuleEvents`
(unit `XData.Module.Events`). Servem para autorização customizada, restringir ou
alterar dados devolvidos pelos CRUD endpoints, e lógica adicional pós-operação.

```delphi
uses XData.Server.Module, XData.Module.Events;

Module.Events.OnEntityInserting.Subscribe(
  procedure(Args: TEntityInsertingArgs)
  begin
    // Args.Entity é a entidade sendo inserida
  end
);
```

Com method reference em vez de método anônimo:

```delphi
procedure TSomeClass.MyEntityInsertingProc(Args: TEntityInsertingArgs);
begin
  // ...
end;

procedure TSomeClass.RegisterMyEventListeners(Module: TXDataServerModule);
begin
  Module.Events.OnEntityInserting.Subscribe(MyEntityInsertingProc);
end;
```

Convenção de nomes: para o evento `X`, a propriedade é `OnX`, o tipo do method
reference é `TXProc` e o parâmetro é `TXArgs` — ex.: `OnEntityInserting`,
`TEntityInsertingProc`, `TEntityInsertingArgs`.

**Todos os eventos são multicast**: vários listeners podem ser adicionados ao
mesmo evento e todos são notificados. Assinar não substitui um listener já
existente. Sempre é seguro configurar os eventos antes de adicionar o módulo e
iniciar o servidor.

Usando os componentes de design-time, os mesmos eventos existem como eventos do
`TXDataServer`, com argumentos idênticos.

---

## 2. Catálogo de eventos

### Uso geral

| Evento | Quando ocorre |
|---|---|
| `OnModuleException` | exceção durante o processamento da requisição; permite tratamento de erro customizado |
| `OnManagerCreate` | um `TObjectManager` é criado para a requisição; permite configurá-lo |

### CRUD endpoints

| Evento | Quando ocorre |
|---|---|
| `OnEntityGet` | após recuperar uma entidade, antes de enviá-la ao cliente. Dispara também ao pedir partes dela (propriedade individual, blob, associada) |
| `OnEntityList` | quando o cliente consulta uma coleção |
| `OnEntityInserting` | imediatamente antes da criação |
| `OnEntityInserted` | imediatamente após a criação |
| `OnEntityModifying` | imediatamente antes da atualização |
| `OnEntityModified` | imediatamente após a atualização |
| `OnEntityDeleting` | imediatamente antes da exclusão |
| `OnEntityDeleted` | imediatamente após a exclusão |

**Diferença crucial entre `-ing` e `-ed`:** os eventos `-ing` (Inserting,
Modifying, Deleting) acontecem **dentro da transação**, então levantar exceção ali
aborta a operação. Os eventos `-ed` acontecem **após o commit** — não há como
fazer rollback, e qualquer operação de banco ali roda **sem transação ativa**
(salvo se você abrir uma manualmente).

### Argumentos

`TEntityGetArgs`, `TEntityInsertingArgs`, `TEntityInsertedArgs`,
`TEntityModifyingArgs`, `TEntityModifiedArgs`, `TEntityDeletingArgs`,
`TEntityDeletedArgs` — todos com:

| Propriedade | Descrição |
|---|---|
| `Entity: TObject` | a entidade envolvida |
| `Handler: TXDataBaseRequestHandler` | o objeto processador da requisição (dá acesso a `Handler.Request`, entre outros) |

`TEntityListArgs`:

| Propriedade | Descrição |
|---|---|
| `Criteria: TCriteria` | a criteria Aurelius montada a partir da requisição, **antes** de ser executada. Pode ser modificada: filtros extras, ordenações, etc. |
| `Handler: TXDataBaseRequestHandler` | processador da requisição |

`TModuleExceptionArgs`:

| Propriedade | Descrição |
|---|---|
| `Exception: Exception` | a exceção levantada |
| `StatusCode: Integer` | status HTTP a devolver; pode ser alterado |
| `ErrorCode: string` | valor de `code` no JSON de erro; pode ser alterado |
| `ErrorMessage: string` | valor de `message` no JSON de erro; pode ser alterado |
| `Action: TModuleExceptionAction` | `(SendError, RaiseException, Ignore)` |

`TModuleExceptionAction`:
- `SendError` (padrão) — envia a resposta HTTP com `StatusCode`, `ErrorCode` e `ErrorMessage`.
- `RaiseException` — relança a exceção original, dando chance a algum middleware
  Sparkle de tratá-la; se ninguém tratar, cai no dispatcher.
- `Ignore` — o XData não faz nada; use quando você mesmo já enviou uma resposta
  HTTP customizada.

```delphi
Module.Events.OnModuleException.Subscribe(
  procedure(Args: TModuleExceptionArgs)
  begin
    if Args.Exception is EInvalidJsonProperty then
      Args.StatusCode := 400;
  end
);
```

`TManagerCreateArgs`:

| Propriedade | Descrição |
|---|---|
| `Manager: TObjectManager` | o manager recém-criado |

Uso típico: habilitar filtros Aurelius, por exemplo em multitenancy.

```delphi
Module.Events.OnManagerCreate.Subscribe(
  procedure(Args: TManagerCreateArgs)
  begin
    Args.Manager.EnableFilter('Multitenant').SetParam('tenantId', 123);
  end
);
```

---

## 3. JWT: conceito e fluxo

Autenticação e autorização no XData vêm dos mecanismos genéricos do TMS Sparkle,
que servem a qualquer servidor HTTP. JWT é apenas a abordagem mais comum — a
autorização funciona igual independentemente do tipo de token.

Um JWT é uma string de três partes separadas por ponto, cada uma em base64-url:

```
<header>.<claims>.<signature>
```

Header decodificado:
```json
{ "alg": "HS256", "typ": "JWT" }
```

Payload (claims):
```json
{ "name": "tmsuser", "iss": "TMS XData Server", "admin": true }
```

A assinatura é o hash do header, do payload e de um **segredo** que só o servidor
conhece. Como o cliente não tem o segredo, não consegue forjar um payload
alterado: a assinatura não bateria e o token seria rejeitado.

Fluxo:
1. o cliente faz login enviando credenciais;
2. o servidor valida, gera o JWT com as informações relevantes e devolve;
3. o cliente reenvia o JWT nas requisições seguintes;
4. o servidor valida a assinatura a cada requisição e confia no payload.

Internamente o XData usa a biblioteca open source Delphi JOSE and JWT.

---

## 4. Login e geração do token

Contrato:

```delphi
[ServiceContract]
ILoginService = interface(IInvokable)
['{BAD477A2-86EC-45B9-A1B1-C896C58DD5E0}']
  function Login(const UserName, Password: string): string;
end;
```

Implementação (exemplo simplificado — a verificação real de senha é sua):

```delphi
uses Bcl.Jose.Core.JWT, Bcl.Jose.Core.Builder;

function TLoginService.Login(const User, Password: string): string;
var
  JWT: TJWT;
  Scopes: string;
begin
  if User <> Password then   // NÃO use esta lógica em produção
    raise EXDataHttpUnauthorized.Create('Invalid password');

  JWT := TJWT.Create;
  try
    JWT.Claims.SetClaimOfType<string>('user', User);
    if User = 'admin' then
      JWT.Claims.SetClaimOfType<Boolean>('admin', True);
    Scopes := 'reader';
    if (User = 'admin') or (User = 'writer') then
      Scopes := Scopes + ' writer';
    JWT.Claims.SetClaimOfType<string>('scope', Scopes);
    JWT.Claims.Issuer := 'XData Server';
    Result := TJOSE.SHA256CompactToken('secret', JWT);
  finally
    JWT.Free;
  end;
end;
```

Chamada:

```http
POST /loginservice/login HTTP/1.1
content-type: application/json

{ "UserName": "writer", "Password": "writer" }
```

Resposta:

```json
{ "value": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoi..." }
```

Requisições seguintes:

```http
GET /artist?$orderby=Name HTTP/1.1
authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

> **Em produção, sempre HTTPS.** Sem TLS, credenciais e token trafegam em claro.
> O mecanismo de login é sugestão: o token pode vir de outro serviço, outro
> servidor, outro método de autenticação, ou de um provedor terceiro.

---

## 5. TJwtMiddleware

Segundo passo: instalar o middleware que valida o token.

```delphi
uses Sparkle.Middleware.Jwt;

Module.AddMiddleware(TJwtMiddleware.Create('secret'));
```

Em design-time: botão direito no `TXDataServer` → gerenciar lista de middlewares →
adicionar o JWT Middleware. Ele tem o evento `OnGetSecret`, onde você fornece o
segredo usado na validação.

O que o middleware faz: procura o token no header `Authorization`; se existir e a
assinatura for válida, cria uma `IUserIdentity`, preenche seus `Claims` a partir
das claims do JWT, e a atribui à propriedade `User` do `THttpRequest`.

> **Atenção:** por padrão, exista o token ou não, o middleware **encaminha** a
> requisição ao seu servidor. Cabe a você verificar se há usuário. Para bloquear
> requisições anônimas no próprio middleware, defina
> `ForbidAnonymousAccess := True`.
>
> Se o token existir e for **inválido**, o middleware devolve erro imediatamente e
> seu código não executa.

---

## 6. Chaves assimétricas (RS256)

Alternativa mais segura e flexível ao segredo compartilhado: assine com a chave
privada (que nunca sai do seu servidor) e distribua a chave pública para quem
precisa validar.

XData/Sparkle esperam as chaves em **formato texto PEM**. Gerando com `ssh-keygen`
no Windows:

```
ssh-keygen -t rsa -b 2048 -m PEM -N "" -f rsa256-private.key
ssh-keygen -e -m PEM -f rsa256-private.key > rsa256-public.key
```

Isso gera `rsa256-private.key` (privada, PEM) e `rsa256-public.key` (pública, PEM).
Um terceiro arquivo `rsa256-private.key.pub` também é criado, mas num formato
**não suportado** pelo XData — ignore-o.

### Assinando

```delphi
const
  JWTSecret = 'super_secret_0123456789_0123456789';
  SignWithRSA = False;   // True para usar chaves assimétricas
  RSAKeyId = 'D00CD046-FEDA-4120-9258-391371649A32';

function TLoginService.Login(const User, Password: string): string;
var
  JWT: TJWT;
  JWK: TJWK;
  SigningKey: TArray<Byte>;
  SigningAlgorithm: TJOSEAlgorithmId;
begin
  if User <> Password then
    raise EXDataHttpUnauthorized.Create('Invalid password');

  JWT := TJWT.Create;
  try
    JWT.Claims.SetClaimOfType<string>('custom', 'data');

    if SignWithRSA then
    begin
      SigningKey := TFile.ReadAllBytes('rsa256-private.key');
      SigningAlgorithm := TJOSEAlgorithmId.RS256;
      Jwt.Header.KeyID := RSAKeyId;
    end
    else
    begin
      SigningKey := TEncoding.UTF8.GetBytes(JWTSecret);
      SigningAlgorithm := TJOSEAlgorithmId.HS256;
    end;

    JWK := TJWK.Create(SigningKey);
    try
      Result := TJOSE.SerializeCompact(JWK, SigningAlgorithm, JWT, False);
    finally
      JWK.Free;
    end;
  finally
    JWT.Free;
  end;
end;
```

### Validando

Use o evento `OnGetSecretEx` do middleware, que dá acesso ao algoritmo e ao KeyID
do token recebido:

```delphi
procedure TServerModule.XDataServer1JWTGetSecretEx(Sender: TObject;
  const JWT: TJWT; Context: THttpServerContext; var Secret: TBytes);
begin
  if JWT.Header.Algorithm = 'HS256' then
    Secret := TEncoding.UTF8.GetBytes(JWTSecret)
  else
  if JWT.Header.Algorithm = 'RS256' then
  begin
    if JWT.Header.KeyID = RSAKeyId then
      Secret := TFile.ReadAllBytes('rsa256-public.key')
    else
      raise EJOSEException.CreateFmt('Unknown KeyId in JWT', [JWT.Header.KeyID]);
  end
  else
    raise EJOSEException.CreateFmt('JWS algorithm [%s] is not supported',
      [JWT.Header.Algorithm]);
end;
```

Se você só suporta um dos algoritmos, remova o ramo correspondente.

---

## 7. Atributos de autorização

Unit `XData.Security.Attributes`.

Como o XData tem dois mecanismos de endpoint, há dois conjuntos de atributos. Os
de CRUD têm o prefixo `Entity` e recebem um parâmetro extra
`TEntitySetPermissions` indicando a **quais operações** a regra se aplica.

Todos podem ser aplicados no **método** e/ou na **interface**. Aplicados em ambos,
todos os requisitos precisam ser satisfeitos.

### Authorize

Exige apenas que a requisição esteja autenticada. Sem isso, **403 Forbidden**.

```delphi
[ServiceContract]
IMyService = interface(IInvokable)
['{80A69E6E-CA89-41B5-A854-DFC412503FEA}']
  function NonRestricted: string;
  [Authorize]
  function Restricted: string;
end;
```

No nível da interface, vale para todos os métodos:

```delphi
[ServiceContract]
[Authorize]
IMyService = interface(IInvokable)
```

### AuthorizeScopes

Verifica a claim `scope`, cujos valores são separados por **espaço** (ex.:
`reader writer`).

```delphi
[AuthorizeScopes('admin')]
procedure ResetAll;
```

Escopos **alternativos** separados por vírgula (basta um):

```delphi
[AuthorizeScopes('admin,writer')]
procedure ModifyEverything;
```

Múltiplos atributos = requisitos **cumulativos** (todos necessários):

```delphi
[AuthorizeScopes('publisher')]
[AuthorizeScopes('editor')]
procedure PublishAndModify;
```

### AuthorizeClaims

Verifica uma claim arbitrária, com ou sem valor específico.

```delphi
[AuthorizeClaims('admin')]
procedure OnlyForAdmins;

[AuthorizeClaims('user', 'john')]
procedure MethodForJohn;
```

### EntityAuthorize

Aplicado à **classe da entidade**, protege os CRUD endpoints dela.

```delphi
[Entity, Automapping]
[EntityAuthorize(EntitySetPermissionsWrite)]
TCustomer = class
```
→ POST/PUT/DELETE exigem requisição autenticada.

> **Cuidado:** a regra é por permissão. No exemplo acima, as permissões de leitura
> não foram especificadas e portanto **não estão protegidas** — qualquer um lista
> e lê clientes.

### EntityAuthorizeScopes

```delphi
[Entity, Automapping]
[EntityAuthorizeScopes('reader', EntitySetPermissionsRead)]
[EntityAuthorizeScopes('writer', EntitySetPermissionsWrite)]
TArtist = class
```
Para ler e escrever, a claim `scope` precisa conter `reader writer`.

Alternativa em que `writer` já implica leitura:

```delphi
[Entity, Automapping]
[EntityAuthorizeScopes('reader,writer', EntitySetPermissionsRead)]
[EntityAuthorizeScopes('writer', EntitySetPermissionsWrite)]
TArtist = class
```

### EntityAuthorizeClaims

```delphi
[Entity, Automapping]
[EntityAuthorizeClaims('user', 'john', [TEntitySetPermissions.Delete])]
TArtist = class
```
Só quem tem a claim `user` = `john` pode apagar artistas.

---

## 8. Autorização manual e via eventos

### Dentro da service operation

```delphi
uses Sparkle.Security, XData.Sys.Exceptions;

procedure TMyService.DoSomething;
var
  User: IUserIdentity;
begin
  User := TXDataOperationContext.Current.Request.User;
  if User = nil then
    raise EXDataHttpUnauthorized.Create('User not authenticated');
  if not (User.Claims.Exists('admin') and User.Claims['admin'].AsBoolean) then
    raise EXDataHttpForbidden.Create('Not enough privileges');

  // usuário autenticado e administrador — executa
end;
```

Exceções úteis: `EXDataHttpUnauthorized` (401), `EXDataHttpForbidden` (403),
`EXDataHttpException.Create(<status>, <msg>)` para status arbitrário.

### Protegendo CRUD endpoints com eventos

```delphi
Module.Events.OnEntityDeleting.Subscribe(
  procedure(Args: TEntityDeletingArgs)
  var
    User: IUserIdentity;
  begin
    User := TXDataOperationContext.Current.Request.User;
    if User = nil then
      raise EXDataHttpUnauthorized.Create('User not authenticated');
    if not User.Claims.Exists('admin') then
      raise EXDataHttpForbidden.Create('Not enough privileges');
  end
);
```

Isso vale para todas as entidades; para restringir, teste `Args.Entity` e verifique
a classe.

### Filtrando consultas por usuário

O caso mais interessante: consultas complexas não podem ser tratadas entidade a
entidade. Use `OnEntityList`, que entrega a criteria antes da execução:

```delphi
Module.Events.OnEntityList.Subscribe(
  procedure(Args: TEntityListArgs)
  var
    User: IUserIdentity;
    IsAdmin: Boolean;
  begin
    User := Args.Handler.Request.User;
    IsAdmin := (User <> nil) and User.Claims.Exists('admin');
    if not IsAdmin then
      Args.Criteria.Add(not Linq['Protected']);
  end
);
```

Não-administradores simplesmente não veem as entidades protegidas — a restrição
vai para o SQL, seja qual for a query que o cliente montou.
