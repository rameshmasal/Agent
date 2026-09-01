import { slugify } from './utils.js'

export function buildGitHubDeliveryAction({ ticketKey, appDescriptor, validation }) {
  return {
    name: 'github-delivery',
    approvalRequired: true,
    status: validation.status === 'passed' ? 'pending-approval' : 'blocked',
    blockedReason:
      validation.status === 'passed' ? null : 'Local validation must pass before GitHub delivery can be approved.',
    summary: `Create a branch and PR for ${appDescriptor.repoName}.`,
    suggestedBranch: `codex/${slugify(ticketKey || appDescriptor.artifactId)}`,
    suggestedCommitMessage: `feat: scaffold ${appDescriptor.artifactId} from ${ticketKey || 'manual input'}`
  }
}
