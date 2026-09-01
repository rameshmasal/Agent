#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { runMulesoftCodingAgent, renderRunSummaryMarkdown, writeGeneratedOutput } from './index.js'

function parseArgs(argv) {
  const parsed = {
    input: null,
    output: null,
    format: 'markdown',
    workspaceRoot: path.resolve(process.cwd(), '..')
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '--input' || token === '-i') parsed.input = argv[++index]
    else if (token === '--output' || token === '-o') parsed.output = argv[++index]
    else if (token === '--format' || token === '-f') parsed.format = argv[++index]
    else if (token === '--workspace-root') parsed.workspaceRoot = argv[++index]
  }

  return parsed
}

function usage() {
  return 'Usage: node src/coding/cli.js --input examples/contact-details.ticket.json [--output outputs/contact-details] [--format json|markdown] [--workspace-root /path/to/AIagents]'
}

async function main() {
  const argv = parseArgs(process.argv.slice(2))
  if (!argv.input) {
    console.error(usage())
    process.exitCode = 1
    return
  }

  const input = JSON.parse(fs.readFileSync(argv.input, 'utf8'))
  const artifact = await runMulesoftCodingAgent({
    input,
    workspaceRoot: path.resolve(argv.workspaceRoot)
  })

  if (argv.output && artifact.generatedProject?.files) {
    const projectRoot = writeGeneratedOutput({
      artifact,
      outputDir: path.resolve(argv.output)
    })
    if (argv.format === 'json') {
      process.stdout.write(`${JSON.stringify({ outputDir: argv.output, projectRoot, status: artifact.status }, null, 2)}\n`)
      return
    }

    process.stdout.write(`${renderRunSummaryMarkdown(artifact)}\nGenerated project: ${projectRoot}\n`)
    return
  }

  const output =
    argv.format === 'json'
      ? JSON.stringify(artifact, null, 2)
      : renderRunSummaryMarkdown(artifact)

  process.stdout.write(`${output}\n`)
}

main()
