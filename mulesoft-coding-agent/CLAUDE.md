# CLAUDE.md - mulesoft-coding-agent

## Project Scope

This is the standalone MuleSoft coding agent. It generates one new RAML-first Mule app per Jira ticket using a skill-first, approval-gated workflow.

## Workflow Order

1. **Discovery wave (parallel):** `jira-ticket-reader` + `existing-mule-api-scanner`
2. `jira-clarifier` — stop if blocked
3. `mulesoft-architecture-recommender-adapter` — stop at planning output if multi-API
4. `raml-author`
5. `mule-project-scaffolder`
6. **Generation wave (parallel):** `mule-flow-writer`, `dwl-transform-writer`, `mock-runtime-configurator`, `munit-test-author`
7. `mule-validator`
8. Stop for approval before: `exchange-publisher`, `github-delivery`, `jira-sync`

## Hard Rules

- Generate one new Mule app per ticket in v1
- Keep existing `int-mulesoft-*` repos read-only
- RAML is the source of truth for all generation
- All remote actions (Exchange, GitHub, Jira) are approval-gated
- Stop after planning output when a ticket requires multiple coordinated APIs

## File Ownership

Each module owns specific output paths — do not cross boundaries:

| Module | Owns |
|--------|------|
| `mule-project-scaffolder` | `pom.xml`, `mule-artifact.json`, `README.md`, `log4j2.xml`, `log4j2-test.xml` |
| `raml-author` | `src/main/resources/api/**` |
| `mule-flow-writer` | `src/main/mule/**` |
| `dwl-transform-writer` | `src/main/resources/transformdata/**`, `src/test/resources/*.json` |
| `mock-runtime-configurator` | `src/main/resources/properties/**` |
| `munit-test-author` | `src/test/munit/**`, `src/test/resources/examples/**` |

## CLI

```bash
npm run generate:mule -- --input examples/contact-details.ticket.json --output outputs/contact-details
npm run test:coding
```
