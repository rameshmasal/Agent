export function buildExchangePublishAction({ appDescriptor, validation }) {
  return {
    name: 'exchange-publisher',
    approvalRequired: true,
    status: validation.status === 'passed' ? 'pending-approval' : 'blocked',
    blockedReason:
      validation.status === 'passed' ? null : 'Local validation must pass before Exchange publish can be approved.',
    summary: `Publish ${appDescriptor.artifactId} RAML to Anypoint Exchange.`,
    suggestedCommand: `mvn deploy -DskipTests -DassetId=${appDescriptor.artifactId}`
  }
}
