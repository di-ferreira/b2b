---
name: software-replication
description: Orchestrates reverse engineering, behavioral specification, TDD, migration and behavioral validation of existing software into a different technology stack.
---

# Software Replication

## Purpose

This skill orchestrates the complete replication of an existing software
system into a different technology stack.

The objective is NOT code translation.

The objective is behavioral reconstruction.

The canonical workflow is:

ANALYZE
↓
SPECIFY
↓
TEST
↓
MIGRATE
↓
VALIDATE

---

# 1. Core Principle

Always preserve behavior before implementation style.

SOURCE is the source of functional evidence.

TARGET must be implemented idiomatically.

Never reproduce SOURCE architecture blindly.

Never translate code mechanically.

The question is:

"What does the system do?"

Not:

"How was the code written?"

---

# 2. Related Skills

Use the following skills whenever applicable.

ANALYZE:

- spec-miner
- domain-modeling

Delphi SOURCE:

- use Delphi-specific analysis knowledge
- inspect IntraWeb
- inspect UniGUI
- inspect TMS WEB Core

SPECIFY:

- domain-modeling
- grill-with-docs

TEST:

- tdd

MIGRATE:

- codebase-design
- improve-codebase-architecture

VALIDATE:

- verification-before-completion
- systematic-debugging

Web/E2E:

- webapp-testing
- agent-browser

Frontend:

- vercel-react-best-practices
- web-design-guidelines

---

# 3. Evidence Classification

Every relevant discovery must be classified as one of:

FACT
INFERENCE
ASSUMPTION
GAP
BUG
DECISION
IMPROVEMENT

Never present an assumption as a fact.

Never hide a GAP.

Never silently change behavior.

---

# 4. ANALYZE

Do not modify TARGET implementation.

Inspect SOURCE completely enough to understand:

- modules
- architecture
- domain
- workflows
- business rules
- validation
- state transitions
- integrations
- permissions
- errors
- side effects
- UI behavior
- APIs
- configuration

For Delphi inspect:

- Units
- Forms
- Frames
- DataModules
- Classes
- Interfaces
- Records
- Enums
- Helpers
- Generics
- Events
- Callbacks
- Datasets
- Queries
- Transactions
- Exceptions
- third-party components
- IntraWeb
- UniGUI
- TMS WEB Core

Do not trust class names without tracing behavior.

---

# 5. Documentation

Maintain:

docs/replication/

Organize documentation into:

analysis/
specifications/
tests/
validation/
reports/

At minimum maintain:

- overview
- modules
- domain model
- business rules
- use cases
- workflows
- API contracts
- integrations
- validation rules
- errors
- permissions
- UI behavior when applicable
- bugs
- gaps
- source/target mapping
- test scenarios
- parity matrix
- progress

Documentation is persistent project context.

---

# 6. SPECIFY

Convert discoveries into technology-independent specifications.

For each feature document:

FEATURE
PURPOSE
PRECONDITIONS
INPUT
BUSINESS RULES
VALIDATIONS
PROCESSING
OUTPUT
SIDE EFFECTS
ERROR CASES
PERMISSIONS
INTEGRATIONS
UI BEHAVIOR
SOURCE EVIDENCE
TEST SCENARIOS

Use identifiers:

FEAT-XXX
UC-XXX
BR-XXX
API-XXX
SC-XXX
TEST-XXX
BUG-XXX
GAP-XXX

---

# 7. TEST

Tests MUST be created before implementation.

Required lifecycle:

RED
GREEN
REFACTOR

Tests must verify behavior through public contracts.

Prefer:

- Unit
- Integration
- Contract
- E2E
- Regression

Each test must map to a specification.

Example:

BR-001
↓
SC-001
↓
TEST-001

---

# 8. MIGRATE

Implement only from the specification and tests.

Never blindly copy SOURCE architecture.

Adapt concepts to TARGET.

Example:

Delphi Form
→
Next.js Page / Component

Delphi DataModule
→
Application / Infrastructure Service

Dataset
→
Repository / API Client

Business Rule
→
Domain Rule / Use Case

Event Handler
→
UI Event / Application Command

The mapping must be based on responsibility,
not syntax.

---

# 9. TARGET

Prefer:

- SOLID
- Clean Code
- low coupling
- high cohesion
- dependency inversion
- testability
- simple abstractions

Avoid:

- overengineering
- unnecessary layers
- artificial abstractions
- duplication
- business logic inside UI components

When TARGET is Next.js:

UI
↓
Application
↓
Domain
↓
Infrastructure / Internal API

---

# 10. Bugs

When SOURCE behavior appears incorrect:

Do not automatically reproduce it.

Create BUG-XXX.

Document:

- SOURCE behavior
- expected behavior
- evidence
- impact
- target decision
- test

If the bug is confirmed, TARGET should prefer the corrected behavior.

Never silently "fix" SOURCE behavior.

---

# 11. Gaps

When behavior cannot be determined:

Create GAP-XXX.

Do not invent behavior.

Record:

- available evidence
- missing information
- hypothesis
- impact
- temporary decision

Prefer interfaces/adapters/configuration when practical.

---

# 12. VALIDATE

Compare:

SOURCE
↓
SPECIFICATION
↓
TARGET

Classify:

MATCH
PARTIAL MATCH
MISMATCH
BUG FIX
IMPROVEMENT
UNKNOWN

Never declare MATCH without evidence.

For every mismatch:

1. investigate
2. classify
3. determine cause
4. create/adjust test
5. fix or document decision

---

# 13. Parity Matrix

Maintain:

docs/replication/validation/parity-matrix.md

Format:

| ID     | Feature  | Source | Target | Test | Status  |
| ------ | -------- | ------ | ------ | ---- | ------- |
| BR-001 | Credit   | OK     | OK     | PASS | MATCH   |
| BR-002 | Order    | OK     | OK     | PASS | MATCH   |
| BR-003 | Discount | BUG    | FIXED  | PASS | BUG FIX |

---

# 14. Completion

A feature is complete only when:

- behavior analyzed
- specification created
- tests created
- RED observed
- implementation completed
- GREEN observed
- refactoring completed when necessary
- integration verified
- documentation updated
- parity evaluated
- gaps documented
- bugs evaluated

Code compilation alone is never sufficient.

---

# 15. Incremental Execution

Never migrate a large system blindly in one operation.

Work by functional slice.

Recommended order:

1. domain
2. business rules
3. use cases
4. contracts
5. authentication/authorization
6. integrations
7. UI
8. secondary functionality

For every slice:

SPEC
↓
TEST
↓
IMPLEMENT
↓
VALIDATE
↓
DOCUMENT

Then continue.

