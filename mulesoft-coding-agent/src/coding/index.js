import fs from 'node:fs'
import path from 'node:path'
import { readJiraTicketArtifact } from './jira-ticket-reader.js'
import { clarifyWorkOrder } from './jira-clarifier.js'
import { scanExistingMuleApis } from './existing-mule-api-scanner.js'
import { adaptArchitectureRecommendation } from './mulesoft-architecture-recommender-adapter.js'
import { authorRaml } from './raml-author.js'
import { scaffoldMuleProject } from './mule-project-scaffolder.js'
import { writeMuleFlows } from './mule-flow-writer.js'
import { writeDwlTransforms } from './dwl-transform-writer.js'
import { configureMockRuntime } from './mock-runtime-configurator.js'
import { authorMunitTests } from './munit-test-author.js'
import { validateGeneratedProject } from './mule-validator.js'
import { buildExchangePublishAction } from './exchange-publisher.js'
import { buildGitHubDeliveryAction } from './github-delivery.js'
import { buildJiraSyncAction } from './jira-sync.js'
import { renderRunSummaryMarkdown } from './render-markdown.js'
import { writeFileMap } from './utils.js'

function mergeFileMaps(...fileMaps) {
  return fileMaps.reduce((merged, fileMap) => ({ ...merged, ...(fileMap || {}) }), {})
}

function buildParallelizationPlan() {
  return {
    discoveryWave: {
      mode: 'parallel-sub-agents',
      subAgents: [
        {
          name: 'ticket-intake-subagent',
          skill: 'jira-ticket-reader',
          writeScope: [],
          reason: 'Normalize Jira ticket input into a structured Mule work order.'
        },
        {
          name: 'existing-api-scan-subagent',
          skill: 'existing-mule-api-scanner',
          writeScope: [],
          reason: 'Scan existing Mule repos read-only for reuse and extension guidance.'
        }
      ]
    },
    generationWave: {
      mode: 'parallel-sub-agents-after-raml',
      subAgents: [
        {
          name: 'flow-subagent',
          skill: 'mule-flow-writer',
          writeScope: ['src/main/mule/**'],
          reason: 'Generate listener, router, reusable flows, and auth hooks.'
        },
        {
          name: 'transform-subagent',
          skill: 'dwl-transform-writer',
          writeScope: ['src/main/resources/transformdata/**'],
          reason: 'Generate canonical request/response transforms and mock payloads.'
        },
        {
          name: 'config-subagent',
          skill: 'mock-runtime-configurator',
          writeScope: ['src/main/resources/properties/**', 'src/main/resources/log4j2.xml'],
          reason: 'Configure mock-mode local runtime and environment property templates.'
        },
        {
          name: 'test-subagent',
          skill: 'munit-test-author',
          writeScope: ['src/test/**'],
          reason: 'Generate smoke-level MUnit coverage and sample request artifacts.'
        }
      ]
    },
    validationPreparation: {
      mode: 'parallel-read-checks',
      checks: [
        'required-file-layout',
        'resource-reference-integrity',
        'test-presence-check',
        'raml-and-flow-consistency'
      ]
    },
    serializedSkills: [
      'jira-clarifier',
      'mulesoft-architecture-recommender-adapter',
      'raml-author',
      'mule-project-scaffolder',
      'mule-validator',
      'exchange-publisher',
      'github-delivery',
      'jira-sync'
    ],
    notSubAgentSteps: [
      'clarification',
      'architecture decision',
      'RAML finalization',
      'final project assembly',
      'Maven package',
      'approval handling',
      'Exchange publish',
      'GitHub delivery',
      'Jira updates'
    ]
  }
}

export async function runMulesoftCodingAgent({ input, workspaceRoot }) {
  const parallelizationPlan = buildParallelizationPlan()
  const [ticketArtifact, existingApiScan] = await Promise.all([
    Promise.resolve(readJiraTicketArtifact(input)),
    Promise.resolve(scanExistingMuleApis({ workspaceRoot, workOrder: input.context || input.workOrder || {} }))
  ])

  const clarification = clarifyWorkOrder(ticketArtifact.workOrder)
  if (clarification.status === 'blocked-for-clarification') {
    return {
      artifactKind: 'mulesoft-coding-run',
      generatedAt: new Date().toISOString(),
      status: 'blocked-for-clarification',
      ticket: ticketArtifact.ticket,
      workOrder: ticketArtifact.workOrder,
      clarification,
      existingApiScan,
      parallelizationPlan,
      remoteActions: []
    }
  }

  const workOrder = {
    ...ticketArtifact.workOrder,
    securityModel: ticketArtifact.workOrder.securityModel || clarification.resolvedDefaults.securityModel
  }

  const architecture = adaptArchitectureRecommendation({ workOrder, existingApiScan })

  if (architecture.requiresMultipleApis) {
    return {
      artifactKind: 'mulesoft-coding-run',
      generatedAt: new Date().toISOString(),
      status: 'planning-only',
      ticket: ticketArtifact.ticket,
      workOrder,
      clarification,
      architecture,
      existingApiScan,
      parallelizationPlan,
      remoteActions: []
    }
  }

  const ramlPackage = authorRaml({ workOrder, architecture })
  const scaffold = scaffoldMuleProject({
    appDescriptor: ramlPackage.appDescriptor,
    workOrder,
    architecture
  })

  const [flows, transforms, mockRuntime, tests] = await Promise.all([
    Promise.resolve(writeMuleFlows({ appDescriptor: ramlPackage.appDescriptor, workOrder, architecture })),
    Promise.resolve(writeDwlTransforms({ workOrder })),
    Promise.resolve(configureMockRuntime({ appDescriptor: ramlPackage.appDescriptor, workOrder })),
    Promise.resolve(authorMunitTests({ appDescriptor: ramlPackage.appDescriptor, workOrder }))
  ])

  const files = mergeFileMaps(
    scaffold.files,
    ramlPackage.files,
    flows.files,
    transforms.files,
    mockRuntime.files,
    tests.files
  )

  const validation = validateGeneratedProject({
    appDescriptor: ramlPackage.appDescriptor,
    files,
    workOrder
  })

  const remoteActions = [
    buildExchangePublishAction({ appDescriptor: ramlPackage.appDescriptor, validation }),
    buildGitHubDeliveryAction({
      ticketKey: ticketArtifact.ticket?.key || workOrder.sourceTicket,
      appDescriptor: ramlPackage.appDescriptor,
      validation
    }),
    buildJiraSyncAction({
      ticketKey: ticketArtifact.ticket?.key || workOrder.sourceTicket,
      appDescriptor: ramlPackage.appDescriptor,
      validation
    })
  ]

  return {
    artifactKind: 'mulesoft-coding-run',
    generatedAt: new Date().toISOString(),
    status: validation.status === 'passed' ? 'ready' : 'validation-failed',
    ticket: ticketArtifact.ticket,
    workOrder,
    clarification,
    architecture,
    existingApiScan,
    appDescriptor: ramlPackage.appDescriptor,
    generatedProject: {
      rootDirName: ramlPackage.appDescriptor.repoName,
      files
    },
    generatedOperations: ramlPackage.operations,
    validation,
    remoteActions,
    parallelizationPlan
  }
}

export function writeGeneratedOutput({ artifact, outputDir }) {
  if (!artifact.generatedProject?.files) return null

  fs.mkdirSync(outputDir, { recursive: true })
  const projectRoot = path.join(outputDir, artifact.generatedProject.rootDirName)
  writeFileMap(projectRoot, artifact.generatedProject.files)
  fs.writeFileSync(path.join(outputDir, 'run-manifest.json'), JSON.stringify(artifact, null, 2))
  fs.writeFileSync(path.join(outputDir, 'run-summary.md'), renderRunSummaryMarkdown(artifact))
  return projectRoot
}

export { renderRunSummaryMarkdown }
