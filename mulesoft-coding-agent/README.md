# MuleSoft Coding Agent

Standalone MuleSoft coding agent for turning Jira tickets into RAML-first Mule projects that can
be imported into Anypoint Code Builder and started locally in mock mode.

## What It Does

This repo implements a skill-first agent workflow for:
- reading Jira ticket input
- asking for clarification when critical API details are missing
- adapting the MuleSoft architecture recommendation into a concrete generation decision
- scanning existing local MuleSoft repos read-only for reuse or extension guidance
- generating a new Mule Maven app from RAML
- authoring Mule XML, DWL transforms, properties, mock-mode config, and MUnit tests
- preparing approval-gated remote actions for Exchange publish, GitHub delivery, and Jira sync

The first version is intentionally scoped to one new Mule app per ticket.

## V1 Boundaries

- Generates one new Mule app per ticket
- Keeps existing Mule repos read-only
- Uses RAML as the source of truth
- Defaults local runtime to mock mode
- Stops at planning output when a ticket clearly requires a coordinated multi-API landscape
- Represents remote actions as approval-gated steps rather than performing them automatically

## Expected Input

The CLI accepts a JSON file containing either:

1. a `ticket` plus optional `context`, or
2. a pre-normalized `workOrder`

The recommended shape is:

```json
{
  "ticket": {
    "key": "INT-101",
    "summary": "Create System API to pull Salesforce contact details",
    "description": "Build a MuleSoft system API for contact retrieval.",
    "labels": ["mulesoft", "system-api", "salesforce"]
  },
  "context": {
    "capability": "contact-details",
    "targetApiLayer": "system",
    "downstreamSystems": ["Salesforce Service Cloud"],
    "operations": [
      {
        "method": "GET",
        "path": "/contact",
        "summary": "Retrieve a contact by contactId",
        "queryParameters": [
          { "name": "contactId", "type": "string", "required": true }
        ],
        "responseExample": {
          "success": true,
          "contactId": "003000000000001AAA"
        }
      }
    ],
    "securityModel": {
      "type": "jwt-bearer",
      "preserveExactPattern": true
    }
  }
}
```

## CLI Usage

Generate an artifact summary only:

```bash
npm run generate:mule -- \
  --input examples/contact-details.ticket.json \
  --format markdown
```

Write the generated Mule app and run manifest to disk:

```bash
npm run generate:mule -- \
  --input examples/contact-details.ticket.json \
  --output outputs/contact-details
```

Override the scan root used for existing Mule repo analysis:

```bash
npm run generate:mule -- \
  --input examples/contact-details.ticket.json \
  --workspace-root /path/to/AIagents \
  --output outputs/contact-details
```

## Repo Layout

```text
.
├── README.md
├── package.json
├── .gitignore
├── src/
│   └── coding/
│       ├── cli.js
│       ├── index.js
│       ├── jira-ticket-reader.js
│       ├── jira-clarifier.js
│       ├── mulesoft-architecture-recommender-adapter.js
│       ├── existing-mule-api-scanner.js
│       ├── raml-author.js
│       ├── mule-project-scaffolder.js
│       ├── mule-flow-writer.js
│       ├── dwl-transform-writer.js
│       ├── mock-runtime-configurator.js
│       ├── munit-test-author.js
│       ├── mule-validator.js
│       ├── exchange-publisher.js
│       ├── github-delivery.js
│       ├── jira-sync.js
│       ├── render-markdown.js
│       └── utils.js
├── tests/
├── examples/
└── .claude/
    ├── agents/
    └── skills/
```

## Parallelism Model

The repo is skill-first. It introduces parallel execution only where it is clearly safe:

- discovery wave
  - Jira intake
  - existing Mule API scan
- generation wave after RAML finalization
  - flow writing
  - transform writing
  - config writing
  - test writing
- validation preparation
  - read-only integrity checks before serialized package/start checks

Architecture decision, RAML finalization, project assembly, validation completion, and all remote
actions remain serialized.

## Status

This is an initial working scaffold. It provides:
- a deterministic local generation pipeline
- a read-only existing API scanner
- a RAML-first Mule app scaffold generator
- static validation and approval-gated remote action descriptors

Live Jira fetch, Exchange publish, GitHub PR creation, and Jira updates can be attached later
without changing the artifact contract.

## Examples And Tests

- Example inputs live in [examples/contact-details.ticket.json](examples/contact-details.ticket.json), [examples/incomplete.ticket.json](examples/incomplete.ticket.json), and [examples/multi-api.ticket.json](examples/multi-api.ticket.json).
- Local tests live in [tests/mulesoft-coding-agent.test.mjs](tests/mulesoft-coding-agent.test.mjs).
- Claude orchestration metadata for the skill-first flow lives under [.claude/skills](.claude/skills) and [.claude/agents](.claude/agents).
