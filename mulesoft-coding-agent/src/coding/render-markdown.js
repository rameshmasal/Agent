export function renderRunSummaryMarkdown(artifact) {
  const lines = [
    `# MuleSoft Coding Run`,
    '',
    `- Ticket: \`${artifact.ticket?.key || artifact.workOrder?.sourceTicket || 'UNKNOWN'}\``,
    `- Capability: \`${artifact.workOrder?.capability || 'unknown'}\``,
    `- Status: \`${artifact.status}\``,
    `- API layer: \`${artifact.architecture?.apiLayer || 'unknown'}\``,
    `- Architecture decision: \`${artifact.architecture?.decision || 'unknown'}\``,
    artifact.appDescriptor?.repoName ? `- Generated repo: \`${artifact.appDescriptor.repoName}\`` : null,
    ''
  ].filter(Boolean)

  if (artifact.existingApiScan?.extensionCandidate) {
    lines.push('## Existing API Scan')
    lines.push(`- Closest extension candidate: \`${artifact.existingApiScan.extensionCandidate.repoName}\``)
    lines.push(`- Reuse guidance: ${artifact.existingApiScan.whyNotReuseAsIs}`)
    lines.push('')
  }

  if (artifact.validation) {
    lines.push('## Validation')
    lines.push(`- Validation status: \`${artifact.validation.status}\``)
    lines.push(`- ACB importable: \`${artifact.validation.acbImportable}\``)
    lines.push(`- Mock mode ready: \`${artifact.validation.mockModeReady}\``)
    if (artifact.validation.errors?.length) {
      lines.push('- Errors:')
      for (const error of artifact.validation.errors) lines.push(`  - ${error}`)
    }
    if (artifact.validation.warnings?.length) {
      lines.push('- Warnings:')
      for (const warning of artifact.validation.warnings) lines.push(`  - ${warning}`)
    }
    lines.push('')
  }

  if (artifact.generatedOperations?.length) {
    lines.push('## Generated Operations')
    for (const operation of artifact.generatedOperations) {
      lines.push(`- \`${operation.method} ${operation.path}\``)
    }
    lines.push('')
  }

  if (artifact.remoteActions?.length) {
    lines.push('## Approval-Gated Remote Actions')
    for (const action of artifact.remoteActions) {
      lines.push(`- \`${action.name}\`: ${action.status}`)
    }
    lines.push('')
  }

  return `${lines.join('\n')}\n`
}
