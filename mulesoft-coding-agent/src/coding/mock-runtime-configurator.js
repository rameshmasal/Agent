import { operationSlug } from './utils.js'

function buildDownstreamPrefix(name, index) {
  return operationSlug({ method: 'CONFIG', path: name || `downstream-${index + 1}` }).replace(/^config-/, '')
}

function renderYaml({ appDescriptor, downstreamSystems, mockMode, environmentName }) {
  const lines = [
    'env: "local"',
    'masterKey: "local-dev-master-key"',
    'anypoint:',
    '  platform:',
    '    client_id: "replace-me"',
    '    client_secret: "replace-me"',
    `${appDescriptor.artifactId}:`,
    `  api-discovery:`,
    `    id: "0"`,
    `  http-listener:`,
    `    port: "8081"`,
    `    path: "/api/*"`,
    `    console: "/console/*"`,
    `app:`,
    `  mockMode: "${mockMode ? 'true' : 'false'}"`
  ]

  downstreamSystems.forEach((system, index) => {
    const prefix = buildDownstreamPrefix(system, index)
    lines.push(`${prefix}:`)
    lines.push(`  protocol: "${mockMode ? 'HTTP' : 'HTTPS'}"`)
    lines.push(`  host: "${mockMode ? 'localhost' : 'replace-me.apis.newellbrands.com'}"`)
    lines.push(`  port: "${mockMode ? String(9080 + index + 1) : '443'}"`)
  })

  return `${lines.join('\n')}\n`
}

function renderSecureYaml(workOrder) {
  const lines = [
    'backend:',
    '  accessToken: "replace-me"',
    'platform:',
    '  clientId: "replace-me"',
    '  clientSecret: "replace-me"',
    'jira:',
    `  ticket: "${workOrder.sourceTicket || 'UNKNOWN'}"`
  ]
  return `${lines.join('\n')}\n`
}

export function configureMockRuntime({ appDescriptor, workOrder }) {
  const environments = ['local', 'dev', 'qa', 'uat', 'prd']
  const files = {}

  for (const environment of environments) {
    files[`src/main/resources/properties/${environment}.yaml`] = renderYaml({
      appDescriptor,
      downstreamSystems: workOrder.downstreamSystems || [],
      mockMode: environment === 'local',
      environmentName: environment
    })
    files[`src/main/resources/properties/${environment}-secure.yaml`] = renderSecureYaml(workOrder)
  }

  return { files }
}
