---
name: delphi-replication
description: Especialista em engenharia reversa de aplicações Delphi para replicação funcional em outra tecnologia. Analisa Delphi, VCL, IntraWeb, UniGUI e TMS WEB Core, identificando comportamento, regras de negócio, eventos, lifecycle, estado, integrações, persistência, side effects, bugs e evidências para produzir especificações independentes da linguagem.
---

# Delphi Replication

## 1. Objetivo

Esta skill é especializada na análise de sistemas Delphi existentes para
extração de comportamento e preparação de sua replicação em uma tecnologia
de destino diferente.

O objetivo NÃO é traduzir Delphi para outra linguagem.

O objetivo é descobrir:

- o que o sistema faz
- quando faz
- por que faz
- quais condições precisam existir
- quais dados entram
- quais dados saem
- quais estados são alterados
- quais efeitos colaterais são produzidos
- quais eventos disparam o comportamento
- quais regras de negócio estão implícitas
- quais integrações participam do fluxo
- quais comportamentos são bugs
- quais comportamentos devem ser preservados
- quais comportamentos devem ser corrigidos no TARGET

O resultado desta skill deve ser suficientemente claro para que outra skill
possa produzir uma especificação independente de Delphi.

---

# 2. Regra Fundamental

Nunca considere o código Delphi como a especificação.

Considere o código como EVIDÊNCIA.

Utilize:

SOURCE CODE
↓
BEHAVIOR
↓
SPECIFICATION

e não:

SOURCE CODE
↓
TRANSLATION
↓
TARGET CODE

A prioridade é:

1. comportamento observável
2. fluxo real de execução
3. testes existentes
4. regras explícitas
5. implementação
6. configuração
7. documentação
8. comentários
9. nomes de classes/métodos

Comentários, nomes e organização podem estar incorretos ou desatualizados.

---

# 3. Classificação das Evidências

Toda descoberta relevante deve ser classificada.

## FACT

Comportamento diretamente comprovado por código,
execução, teste ou configuração.

## INFERENCE

Comportamento deduzido a partir de múltiplas evidências.

## ASSUMPTION

Hipótese utilizada quando a informação disponível é insuficiente.

## GAP

Comportamento ou regra que não pode ser determinado com segurança.

## BUG

Comportamento aparentemente incorreto.

## DECISION

Decisão tomada para representar o comportamento no TARGET.

## IMPROVEMENT

Comportamento deliberadamente melhorado no TARGET.

Nunca apresente:

- INFERENCE como FACT
- ASSUMPTION como FACT
- BUG como comportamento intencional sem evidência

---

# 4. Estratégia de Análise

A análise deve seguir:

DISCOVER
↓
TRACE
↓
UNDERSTAND
↓
CLASSIFY
↓
DOCUMENT

Nunca conclua comportamento observando apenas um método isolado.

Sempre que possível, trace:

EVENT
↓
HANDLER
↓
METHOD
↓
DEPENDENCIES
↓
STATE CHANGE
↓
SIDE EFFECT
↓
OUTPUT

---

# 5. Estrutura de Projetos Delphi

Analise a estrutura do projeto antes de analisar funcionalidades.

Identifique quando existirem:

- .dpr
- .dproj
- .pas
- .dfm
- .fmx
- .res
- .inc
- .dcu
- .sql
- .ini
- .config
- arquivos de recursos
- packages
- runtime packages
- bibliotecas externas
- componentes de terceiros

Procure:

- Units
- Forms
- Frames
- DataModules
- Services
- Managers
- Controllers
- Repositories
- Helpers
- Utils
- Interfaces
- Models
- DTOs
- Records
- Enums

Não assuma que a estrutura de pastas representa a arquitetura real.

---

# 6. Delphi Units

Para cada Unit relevante, identifique:

- responsabilidade real
- dependências
- tipos públicos
- tipos privados
- interfaces
- classes
- métodos
- propriedades
- variáveis globais
- constantes
- initialization
- finalization
- side effects

Procure dependências indiretas.

A cláusula:

uses
UnitA,
UnitB

não significa necessariamente que o módulo depende
funcionalmente de todo o comportamento dessas Units.

Determine o uso real.

---

# 7. Classes Delphi

Para cada classe importante:

1. identifique sua responsabilidade
2. identifique estado interno
3. identifique dependências
4. identifique invariantes
5. identifique operações públicas
6. identifique efeitos colaterais
7. identifique chamadas indiretas
8. identifique lifecycle
9. identifique herança
10. identifique interfaces implementadas

Não mapeie automaticamente:

Delphi Class
→
TARGET Class

Primeiro determine a responsabilidade.

Uma classe Delphi pode representar:

- entidade
- value object
- service
- repository
- application service
- controller
- presenter
- UI state
- infrastructure adapter
- utility
- aggregate
- coordinator

A responsabilidade real deve definir o mapeamento.

---

# 8. Herança

Analise:

- classe base
- overrides
- virtual methods
- dynamic methods
- abstract methods
- inherited calls
- mensagens herdadas
- lifecycle herdado

Nunca analise um método override isoladamente.

Trace:

override
↓
inherited
↓
base implementation
↓
additional behavior

Identifique o comportamento total.

---

# 9. Interfaces

Identifique:

- contrato
- implementações
- consumidores
- lifecycle
- gerenciamento de referência
- dependências

Em Delphi, atenção especial a:

- interfaces com reference counting
- \_AddRef
- \_Release
- QueryInterface
- implementações múltiplas

Não replique mecanismos de memória do Delphi
quando a tecnologia TARGET possuir abstração melhor.

Preserve somente o comportamento relevante.

---

# 10. Records

Analise se o Record representa:

- DTO
- value object
- configuração
- estado temporário
- estrutura de transporte
- dados de domínio

Não transforme todo Record automaticamente em classe.

No TARGET, escolha:

- type
- interface
- object
- value object
- DTO

conforme responsabilidade.

---

# 11. Properties

Propriedades Delphi podem esconder comportamento.

Analise:

property Nome: String read FNome write SetNome;

O setter pode:

- validar
- normalizar
- disparar evento
- atualizar outro campo
- recalcular valor
- persistir
- alterar estado

Nunca trate uma property como mero campo
sem verificar getters e setters.

---

# 12. Getters e Setters

Procure:

- validações
- lazy initialization
- cálculos
- side effects
- cache
- sincronização
- eventos
- persistência

Exemplo:

SetValor(...)
↓
Validate
↓
Normalize
↓
Update State
↓
Recalculate
↓
Notify

Esse fluxo deve ser documentado como comportamento.

---

# 13. Events

Eventos são uma das principais fontes de comportamento implícito em Delphi.

Para cada Event:

- quem declara
- quem registra
- quem atribui
- quem dispara
- quando dispara
- quantas vezes dispara
- ordem de execução
- parâmetros
- efeitos colaterais

Mapeie:

EVENT SOURCE
↓
EVENT TRIGGER
↓
HANDLER
↓
BEHAVIOR
↓
SIDE EFFECT

Nunca assuma que o nome do evento revela o momento real em que ele ocorre.

---

# 14. Event Handlers

Eventos podem conter regras de negócio.

Exemplos:

- OnCreate
- OnShow
- OnActivate
- OnClose
- OnDestroy
- OnClick
- OnChange
- OnExit
- OnEnter
- OnKeyDown
- OnKeyPress
- OnTimer
- BeforePost
- AfterPost
- BeforeOpen
- AfterOpen
- BeforeCancel
- AfterCancel

Se um handler contiver lógica de domínio:

não classifique automaticamente como lógica de UI.

Extraia a regra de negócio.

---

# 15. Delphi Lifecycle

Analise cuidadosamente lifecycle.

Especialmente:

CREATE
↓
INITIALIZATION
↓
LOAD
↓
ACTIVATE
↓
USER ACTION
↓
UPDATE
↓
SAVE
↓
CLOSE
↓
DESTROY

Verifique:

- criação automática
- criação manual
- ownership
- destruction
- initialization
- finalization
- lazy creation
- singleton
- module lifetime

Lifecycle é comportamento.

Não deve ser descartado durante a migração.

---

# 16. VCL

Quando SOURCE utilizar VCL, analise:

- Form lifecycle
- component ownership
- visual component hierarchy
- events
- data binding
- actions
- actions lists
- menus
- toolbars
- dialogs
- datasets
- timers
- application events

Observe especialmente:

- OnCreate
- OnShow
- OnActivate
- OnClose
- OnDestroy

e a interação entre:

Form
↓
DataModule
↓
Dataset
↓
Business Logic

A arquitetura física VCL não deve ser copiada.

O comportamento deve ser extraído.

---

# 17. DataModules

DataModules podem possuir múltiplas responsabilidades.

Nunca assuma:

DataModule = Repository

Analise se o DataModule contém:

- connection
- transaction
- query
- SQL
- business rules
- validation
- mapping
- caching
- orchestration
- integration
- state

Separe conceitualmente essas responsabilidades.

Exemplo:

DataModule
├── Connection
├── Query
├── Business Validation
├── Mapping
└── Integration

No TARGET:

Infrastructure
Application
Domain
Integration

podem ser separados.

---

# 18. Dataset

Analise cuidadosamente:

- Open
- Close
- Edit
- Append
- Insert
- Post
- Cancel
- Delete
- Locate
- FindKey
- Refresh
- First
- Last
- Next
- Prior

Também analise eventos:

- BeforeOpen
- AfterOpen
- BeforePost
- AfterPost
- BeforeDelete
- AfterDelete
- BeforeScroll
- AfterScroll

Datasets frequentemente ocultam regras de negócio.

Não trate dataset apenas como fonte de dados.

---

# 19. SQL

Quando SQL existir:

Analise:

- SELECT
- INSERT
- UPDATE
- DELETE
- JOIN
- WHERE
- GROUP BY
- HAVING
- ORDER BY
- subqueries
- stored procedures
- functions
- views
- triggers
- parameters

Descubra o objetivo funcional da query.

Exemplo:

SELECT ...
FROM ...
WHERE LIMITE >= :VALOR

não deve ser documentado somente como:

"faz uma consulta".

Documente:

"verifica se o limite disponível do cliente
é suficiente para o valor solicitado".

---

# 20. Transactions

Identifique:

- início
- commit
- rollback
- savepoints
- nested transactions
- transaction boundaries

Determine:

quem é responsável pela transação.

Exemplo:

Use Case
↓
Repository
↓
Transaction

ou:

Service
↓
Transaction
├── Operation A
├── Operation B
└── Operation C

Isso é comportamento importante.

---

# 21. Exceptions

Para cada exception:

- causa
- origem
- captura
- transformação
- mensagem
- tratamento
- recuperação

Identifique:

try
operation
except
handler
end;

Determine:

- o erro é tratado?
- propagado?
- convertido?
- ignorado?
- registrado?
- exibido ao usuário?

Não replique simplesmente a classe da exception.

Preserve comportamento de erro.

---

# 22. Global State

Procure:

- variáveis globais
- singletons
- class variables
- Application
- global DataModules
- caches
- configurações globais
- CurrentUser
- Session
- CurrentCompany
- CurrentBranch

Global state frequentemente esconde dependências.

Documente:

quem cria
quem altera
quem consome
quando existe
quando é destruído

No TARGET, prefira dependências explícitas.

---

# 23. Configuration

Analise:

- INI
- registry
- environment variables
- constants
- config files
- command line
- database configuration
- feature flags

Classifique cada configuração:

APPLICATION
ENVIRONMENT
BUSINESS
INTEGRATION
SECURITY
FEATURE FLAG

Nunca copie secrets.

---

# 24. IntraWeb

Quando SOURCE utilizar IntraWeb,
analise além do comportamento visual.

Observe:

- IWAppForm
- IWForm
- IWFrame
- IWRegion
- IWButton
- IWEdit
- IWDBEdit
- IWDBGrid
- IWComboBox
- IWListbox
- IWTimer
- session
- application
- server events
- callbacks
- async events
- URL/navigation
- session state

Diferencie:

APPLICATION STATE
SESSION STATE
FORM STATE
COMPONENT STATE

Analise especialmente:

- criação da sessão
- criação do form
- lifecycle do form
- eventos
- callbacks
- atualização de componentes
- navegação
- estado entre requests

Não trate IntraWeb como VCL simplesmente.

Embora compartilhe conceitos visuais,
o modelo de execução web altera o comportamento.

---

# 25. IntraWeb Sessions

Identifique dados mantidos por sessão.

Exemplos:

- usuário autenticado
- empresa selecionada
- permissões
- filtros
- estados de tela
- carrinho
- contexto operacional

Documente:

SESSION STATE
↓
READ
↓
WRITE
↓
LIFETIME

No TARGET, o mecanismo de sessão deve ser adaptado
à arquitetura web moderna.

Não copie a implementação Delphi.

---

# 26. IntraWeb Callbacks

Callbacks e async events exigem atenção especial.

Determine:

- evento que inicia
- request
- callback
- servidor
- resposta
- atualização da UI
- tratamento de erro

Mapeie:

USER ACTION
↓
ASYNC REQUEST
↓
SERVER HANDLER
↓
BUSINESS LOGIC
↓
RESPONSE
↓
UI UPDATE

Isso pode resultar em:

- API call
- Server Action
- Server Component
- Client Action
- WebSocket
- fetch
- mutation

no TARGET.

---

# 27. UniGUI

Quando SOURCE utilizar UniGUI,
analise:

- uniGUI Forms
- Frames
- MainForm
- LoginForm
- UniSession
- UniServerModule
- UniMainModule
- UniApplication
- events
- AJAX events
- client events
- server events
- JavaScript injections
- callbacks
- session state
- component state

Diferencie:

CLIENT EVENT
SERVER EVENT
SESSION STATE
APPLICATION STATE

Não assuma que um evento executa no servidor
sem verificar o mecanismo.

---

# 28. UniGUI Session State

Analise:

- usuário atual
- sessão
- contexto
- formulários abertos
- variáveis de sessão
- permissões
- estado de filtros
- estado de componentes

Documente ciclo:

SESSION CREATED
↓
LOGIN
↓
APPLICATION
↓
USER INTERACTION
↓
SESSION STATE
↓
SESSION TERMINATION

---

# 29. UniGUI AJAX / Client Events

Para cada evento:

identifique onde executa:

CLIENT
ou
SERVER

E documente:

CLIENT ACTION
↓
REQUEST
↓
SERVER PROCESSING
↓
RESPONSE
↓
CLIENT UPDATE

JavaScript embutido deve ser analisado como comportamento,
não apenas como implementação.

---

# 30. TMS WEB Core

Quando SOURCE utilizar TMS WEB Core,
analise:

- Forms
- Frames
- components
- events
- routing
- application state
- browser execution
- JavaScript interoperability
- REST calls
- asynchronous operations
- promises
- callbacks
- state changes

Diferencie código executado:

- no browser
- no servidor
- através de API

Identifique interoperabilidade JavaScript.

Não replique Delphi-specific mechanisms quando
TypeScript/React possuir abstração mais adequada.

---

# 31. Async / Await / Callbacks

Delphi legado pode implementar operações assíncronas
por:

- callbacks
- events
- threads
- timers
- anonymous methods
- tasks
- BeginInvoke
- custom async mechanisms

Descubra o comportamento:

START
↓
ASYNC OPERATION
↓
WAIT / CALLBACK
↓
RESULT
↓
UI / STATE UPDATE

Não converta simplesmente callback para Promise.

Primeiro determine a semântica.

---

# 32. Threads

Quando houver:

- TThread
- Synchronize
- Queue
- Timer
- Worker
- Task
- thread pool

analise:

- concorrência
- shared state
- synchronization
- UI thread interaction
- race conditions
- cancellation
- lifecycle

Determine o comportamento funcional.

Não transporte automaticamente problemas de threading
do SOURCE para o TARGET.

---

# 33. REST / HTTP

Quando Delphi consumir APIs:

identifique:

- endpoint
- HTTP method
- headers
- authentication
- payload
- response
- timeout
- retry
- error handling
- serialization
- pagination
- caching

Analise wrappers internos.

Uma função:

GetCustomer()

pode esconder:

HTTP
↓
authentication
↓
mapping
↓
error handling
↓
cache

Documente o fluxo real.

---

# 34. Web Services / SOAP

Quando existir SOAP:

analise:

- service
- operation
- request
- response
- authentication
- fault
- retry
- serialization
- generated client

Extraia o contrato funcional.

Não replique automaticamente o mecanismo SOAP
se o TARGET utilizar outra integração.

---

# 35. Componentes de Terceiros

Identifique componentes externos.

Para cada componente importante:

- responsabilidade
- eventos utilizados
- propriedades relevantes
- comportamento
- integração
- dependências
- limitações

Não assuma que um componente visual
é apenas visual.

Muitos componentes encapsulam:

- acesso a dados
- validação
- comunicação
- serialização
- cálculos

---

# 36. Actions

Analise Delphi Actions:

- TAction
- TCustomAction
- ActionList

Mapeie:

Action
↓
Caption
↓
Enabled
↓
Visible
↓
Execute
↓
Business Behavior

Uma Action pode estar ligada a múltiplos componentes.

Não analise somente o botão.

---

# 37. Authorization

Procure:

- roles
- permissions
- access checks
- user type
- company rules
- menu visibility
- button Enabled
- server-side validation

Muito cuidado:

UI hiding NÃO significa authorization.

Verifique validação no backend também.

Separe:

UI VISIBILITY
vs
BUSINESS AUTHORIZATION

---

# 38. Validation

Classifique validações:

UI VALIDATION
DOMAIN VALIDATION
APPLICATION VALIDATION
DATA VALIDATION
INTEGRATION VALIDATION

Exemplo:

Edit.Text
↓
required?
↓
format?
↓
business rule?
↓
API?
↓
database?

Documente todos os níveis.

---

# 39. Calculations

Para cada cálculo relevante:

- entradas
- fórmula
- precisão
- arredondamento
- ordem das operações
- valores mínimos
- valores máximos
- comportamento para null
- comportamento para zero
- comportamento para negativos

Não altere cálculo apenas porque existe
uma implementação mais elegante.

Primeiro preserve o comportamento.

Depois avalie melhorias.

---

# 40. Null / Empty / Default Values

Delphi possui diferenças importantes entre:

- nil
- ''
- 0
- False
- Null
- Empty dataset
- Unassigned
- Variant Null

Identifique semanticamente a diferença.

Não trate tudo como:

null

no TARGET.

Descubra:

MISSING
EMPTY
ZERO
FALSE
NOT FOUND
UNINITIALIZED

e represente corretamente.

---

# 41. String Handling

Analise:

- Trim
- UpperCase
- LowerCase
- SameText
- Copy
- Pos
- formatting
- locale
- encoding
- date formatting
- decimal formatting

Principalmente quando afetar regras de negócio.

---

# 42. Date / Time

Analise:

- Now
- Date
- Time
- IncDay
- IncMonth
- StartOfDay
- EndOfDay
- time zones
- business days
- local time

Identifique se o comportamento depende:

- timezone
- horário do servidor
- horário do cliente
- banco de dados

Nunca presuma UTC ou local automaticamente.

---

# 43. Formatting

Quando a aplicação produzir:

- moeda
- percentual
- datas
- números
- documentos
- códigos

documente:

INPUT
↓
FORMAT RULE
↓
OUTPUT

No TARGET preserve comportamento observável,
mas use APIs apropriadas.

---

# 44. Printing / Reports / Export

Quando houver:

- FastReport
- QuickReport
- Fortes
- ReportBuilder
- PDF
- Excel
- CSV
- impressão direta

analise:

- input
- filtros
- parâmetros
- layout relevante
- dados
- regras
- ordenação
- cálculos
- permissões
- geração
- destino

Nem sempre o layout deve ser replicado literalmente.

Preserve funcionalidade e requisitos do usuário.

---

# 45. File System

Analise operações:

- create
- read
- update
- delete
- move
- rename
- temporary files
- upload
- download

Documente:

- path
- naming
- format
- lifecycle
- error handling
- permissions

Não replique caminhos físicos do SOURCE
quando a arquitetura TARGET utilizar storage diferente.

---

# 46. Caching

Identifique:

- cache global
- cache por usuário
- cache por sessão
- cache por entidade
- cache TTL
- invalidation
- lazy loading

Documente:

CACHE KEY
CACHE VALUE
CACHE LIFETIME
INVALIDATION RULE

---

# 47. Logging

Analise:

- logs
- audit trails
- error logs
- activity logs

Determine:

- quando grava
- o que grava
- contexto
- usuário
- operação
- resultado
- exception

Não transporte secrets para logs do TARGET.

---

# 48. Feature Flags

Procure:

- booleans
- constants
- configuration flags
- database parameters
- conditional compilation

Diferencie:

TECHNICAL FLAG
BUSINESS FLAG
FEATURE FLAG
LEGACY SWITCH

Documente o comportamento condicionado.

---

# 49. Conditional Compilation

Analise:

{$IFDEF}
{$IF}
{$ELSE}
{$ENDIF}

Identifique diferenças por:

- Windows
- Linux
- build
- environment
- client
- feature
- compiler version

Não presuma qual caminho é válido.

Determine o build efetivamente utilizado.

---

# 50. Hidden Behavior

Procure comportamento escondido em:

- initialization
- finalization
- constructors
- destructors
- property setters
- inherited methods
- event handlers
- class constructors
- global variables
- helper methods
- anonymous methods
- callbacks
- database triggers
- stored procedures

Esses pontos são frequentemente responsáveis
por comportamento que não aparece no fluxo principal.

---

# 51. Business Rules

Quando uma regra for encontrada,
extraia em linguagem independente da tecnologia.

NUNCA:

"se FCliente.Limite > FPedido.Valor então..."

PREFIRA:

"Um pedido pode ser aprovado quando o limite disponível
do cliente é suficiente para o valor solicitado."

Inclua evidência:

SOURCE:
UnitX.pas
Method Y
lines/region when available

---

# 52. Use Cases

Agrupe comportamento em casos de uso.

Exemplo:

UC-001
Criar Cliente

UC-002
Atualizar Cliente

UC-003
Aprovar Pedido

UC-004
Cancelar Pedido

Cada use case deve indicar:

- actor
- preconditions
- input
- flow
- rules
- output
- side effects
- errors

---

# 53. State Machines

Quando uma entidade possuir estados:

IDENTIFY STATES

Exemplo:

DRAFT
↓
SUBMITTED
↓
APPROVED
↓
COMPLETED

ou:

OPEN
↓
CANCELLED

Documente:

- estados
- transições
- gatilhos
- regras
- permissões
- efeitos

Se houver transição inválida,
registre como regra de negócio.

---

# 54. UI Behavior

Quando UI fizer parte do escopo:

não copie apenas:

- posição
- tamanho
- cor
- componente
- fonte

Extraia:

- fluxo
- ações
- estados
- feedback
- validações
- loading
- empty state
- error state
- enabled/disabled
- visibility
- navigation

Exemplo:

Button.Enabled := ClienteSelecionado;

deve ser traduzido como:

"Usuário somente pode executar a operação
quando um cliente estiver selecionado."

---

# 55. Navigation

Analise:

- Show
- ShowModal
- Navigate
- Redirect
- MainForm
- ChildForm
- popup
- wizard
- tabs
- frames

Identifique:

- quem chama
- condição
- estado compartilhado
- retorno
- resultado

---

# 56. Persistence Boundaries

Determine se o SOURCE faz:

UI
↓
Database

ou:

UI
↓
Service
↓
Repository
↓
Database

ou:

UI
↓
Internal API

O objetivo é descobrir o comportamento,
não impor uma arquitetura.

---

# 57. Test Generation Preparation

Esta skill NÃO é responsável por escrever os testes.

Ela deve fornecer material suficiente para a skill `tdd`.

Para cada regra relevante produza:

BR-XXX

com:

Given
When
Then

Exemplo:

BR-001

Given:
customer has available credit

When:
an order is submitted

And:
order value is less than or equal to available credit

Then:
order can be approved

Source Evidence:
UnitX.pas / MethodY

Classification:
FACT

---

# 58. Bug Detection

Quando algo parecer incorreto:

não corrija imediatamente.

Investigue.

Verifique:

- regra de negócio
- chamadas relacionadas
- UI
- persistência
- integrações
- exceções
- testes
- comportamento esperado

Classifique:

BUG-CONFIRMED
BUG-UNCERTAIN
INTENTIONAL-BEHAVIOR

Produza:

BUG-XXX

com:

SOURCE
EVIDENCE
EXPECTED
IMPACT
TARGET RECOMMENDATION

---

# 59. Replication Rules

Durante análise:

NÃO:

- reescreva código
- refatore SOURCE
- corrija SOURCE
- implemente TARGET
- invente regras
- simplifique sem evidência
- elimine comportamento "estranho"

SIM:

- investigar
- rastrear
- documentar
- classificar
- especificar
- registrar gaps
- registrar bugs

---

# 60. Source → Target Mapping

Nunca faça mapping por nome.

Faça mapping por responsabilidade.

Exemplo:

TForm
↓
Page / Screen / Component

TDataModule
↓
Repository / Infrastructure / Service

TDataSet
↓
Repository / API Client

TAction
↓
Command / Use Case / Action Handler

Event Handler
↓
UI Event / Command / Application Logic

Record
↓
DTO / Value Object

Interface
↓
Contract / Interface

Exception
↓
Domain/Application/Infrastructure Error

Esses mappings são exemplos,
não regras automáticas.

---

# 61. Delphi → Next.js

Quando TARGET for Next.js:

Não transporte diretamente:

Form
↓
Component
↓
Database

Prefira identificar:

Presentation
Application
Domain
Infrastructure
Integration

Quando existir uma API interna da empresa:

UI
↓
Application
↓
Internal API

Não acesse diretamente o banco de dados
a partir da camada de UI sem requisito explícito.

---

# 62. Resultado Esperado

Ao terminar a análise de uma unidade funcional,
deve ser possível responder:

1. O que a funcionalidade faz?
2. Quem pode executá-la?
3. Quais entradas são necessárias?
4. Quais pré-condições existem?
5. Quais regras são aplicadas?
6. Quais validações existem?
7. Quais estados mudam?
8. Quais dados são criados/alterados?
9. Quais integrações são chamadas?
10. Quais erros podem ocorrer?
11. Quais efeitos colaterais existem?
12. Quais testes devem existir?
13. Existem bugs?
14. Existem gaps?
15. Qual é a evidência no SOURCE?

Se qualquer resposta importante não puder ser estabelecida,
registre GAP.

---

# 63. Output Contract

Ao finalizar uma análise funcional,
produza ou atualize:

docs/replication/analysis/

e os artefatos correspondentes.

No mínimo:

- feature analysis
- business rules
- use case
- workflow
- state transitions when applicable
- integration behavior
- validation behavior
- error behavior
- UI behavior when applicable
- bugs
- gaps
- source evidence
- test scenarios

---

# 64. Final Principle

O Delphi é apenas a implementação histórica.

A responsabilidade desta skill é descobrir
o comportamento que existe por trás dessa implementação.

Não pense:

"Como transformar Delphi em TypeScript?"

Pense:

"O que este sistema realmente faz,
quais regras fazem isso acontecer,
e quais evidências comprovam cada comportamento?"

Somente depois disso:

SPECIFICATION
↓
TEST
↓
TARGET

