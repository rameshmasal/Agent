import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { runMulesoftCodingAgent } from '../src/coding/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const workspaceRoot = path.resolve(repoRoot, '..')

function readExample(fileName) {
  return JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'examples', fileName), 'utf8')
  )
}

test('generates a ready standalone Mule app for a complete single-API ticket', async () => {
  const artifact = await runMulesoftCodingAgent({
    input: readExample('contact-details.ticket.json'),
    workspaceRoot
  })

  assert.equal(artifact.status, 'ready')
  assert.equal(artifact.architecture.apiLayer, 'system')
  assert.equal(artifact.architecture.requiresMultipleApis, false)
  assert.equal(artifact.validation.status, 'passed')
  assert.ok(artifact.generatedProject)
  assert.ok(artifact.generatedProject.files['pom.xml'])
  assert.ok(artifact.generatedProject.files['src/main/resources/api/sys-contact-details-api-v1.raml'])
  assert.ok(artifact.generatedProject.files['src/main/mule/cf-global.xml'])
  assert.ok(artifact.generatedProject.files['src/test/munit/sys-contact-details-api-v1-test-suite.xml'])
  assert.equal(artifact.generatedOperations.length, 1)
  assert.equal(artifact.generatedOperations[0].path, '/contact')
  assert.deepEqual(
    artifact.parallelizationPlan.discoveryWave.subAgents.map((agent) => agent.name),
    ['ticket-intake-subagent', 'existing-api-scan-subagent']
  )
  assert.deepEqual(
    artifact.parallelizationPlan.generationWave.subAgents.map((agent) => agent.name),
    ['flow-subagent', 'transform-subagent', 'config-subagent', 'test-subagent']
  )
  assert.ok(artifact.existingApiScan.scannedRepoCount >= 1)
})

test('blocks for clarification when the ticket is missing operations and downstream context', async () => {
  const artifact = await runMulesoftCodingAgent({
    input: readExample('incomplete.ticket.json'),
    workspaceRoot
  })

  assert.equal(artifact.status, 'blocked-for-clarification')
  assert.equal(artifact.clarification.status, 'blocked-for-clarification')
  assert.ok(
    artifact.clarification.blocking.includes(
      'At least one API operation is required before RAML generation can begin.'
    )
  )
  assert.ok(
    artifact.clarification.blocking.includes(
      'At least one downstream system must be identified.'
    )
  )
})

test('returns planning-only output when the ticket is explicitly multi-api', async () => {
  const artifact = await runMulesoftCodingAgent({
    input: readExample('multi-api.ticket.json'),
    workspaceRoot
  })

  assert.equal(artifact.status, 'planning-only')
  assert.equal(artifact.architecture.requiresMultipleApis, true)
  assert.match(artifact.architecture.stopReason, /multiple coordinated APIs/i)
  assert.equal(artifact.generatedProject, undefined)
})

test('CLI writes the generated project and run manifest to disk', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mulesoft-coding-agent-'))
  const cliResult = spawnSync(
    process.execPath,
    [
      'src/coding/cli.js',
      '--input',
      'examples/contact-details.ticket.json',
      '--output',
      outputDir,
      '--format',
      'json'
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8'
    }
  )

  assert.equal(cliResult.status, 0, cliResult.stderr)

  const cliJson = JSON.parse(cliResult.stdout)
  assert.equal(cliJson.status, 'ready')
  assert.ok(fs.existsSync(path.join(outputDir, 'run-manifest.json')))
  assert.ok(fs.existsSync(path.join(outputDir, 'run-summary.md')))
  assert.ok(
    fs.existsSync(
      path.join(outputDir, 'int-mulesoft-sys-contact-details-api-v1', 'pom.xml')
    )
  )
})
