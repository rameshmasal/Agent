export function buildJiraSyncAction({ ticketKey, appDescriptor, validation }) {
  return {
    name: 'jira-sync',
    approvalRequired: true,
    status: validation.status === 'passed' ? 'pending-approval' : 'blocked',
    blockedReason:
      validation.status === 'passed' ? null : 'Local validation must pass before Jira sync can be approved.',
    summary: `Post generation and validation summary back to Jira ticket ${ticketKey || 'UNKNOWN'}.`,
    commentTemplate: `Generated ${appDescriptor.repoName}. Validation status: ${validation.status}.`
  }
}
