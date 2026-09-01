import {
  collectMarkdownSection,
  ensureLeadingSlash,
  extractBullets,
  inferCapabilityFromSummary,
  safeJsonParse,
  slugify,
  stripEmpty,
  titleCase,
  toArray,
  uniq
} from './utils.js'

function normalizeOperationShape(operation = {}, index = 0) {
  const method = String(operation.method || 'GET').toUpperCase()
  const path = ensureLeadingSlash(operation.path || `/resource-${index + 1}`)

  return stripEmpty({
    name: operation.name || slugify(`${method} ${path}`),
    method,
    path,
    summary: operation.summary || `${titleCase(method.toLowerCase())} ${path}`,
    description: operation.description || null,
    queryParameters: toArray(operation.queryParameters).map((item) => ({
      name: item.name,
      type: item.type || 'string',
      required: item.required !== false,
      description: item.description || ''
    })),
    requestBody:
      operation.requestBody || operation.requestExample
        ? {
            contentType: operation.requestBody?.contentType || 'application/json',
            example: operation.requestBody?.example || operation.requestExample || {}
          }
        : null,
    responseBody: {
      statusCode: String(operation.responseBody?.statusCode || operation.statusCode || 200),
      contentType: operation.responseBody?.contentType || 'application/json',
      example:
        operation.responseBody?.example ||
        operation.responseExample || {
          success: true,
          message: `${titleCase(method.toLowerCase())} ${path} succeeded`
        }
    }
  })
}

function parseOperationBullets(text = '') {
  const operationsSection = collectMarkdownSection(text, 'Operations')
  const candidateLines = operationsSection ? extractBullets(operationsSection) : extractBullets(text)

  return candidateLines
    .map((line) => {
      const match = line.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(\S+)(?:\s*(?:-|:|–)\s*(.*))?$/i)
      if (!match) return null
      return normalizeOperationShape({
        method: match[1],
        path: match[2],
        summary: match[3]
      })
    })
    .filter(Boolean)
}

function inferDownstreamSystems(description = '', labels = []) {
  const text = `${description}\n${toArray(labels).join('\n')}`.toLowerCase()
  const systems = []

  if (/salesforce|service cloud|sfsc/.test(text)) systems.push('Salesforce Service Cloud')
  if (/sfmc|marketing cloud/.test(text)) systems.push('Salesforce Marketing Cloud')
  if (/jira/.test(text)) systems.push('Jira')
  if (/\bsftp\b/.test(text)) systems.push('SFTP')
  if (/slack/.test(text)) systems.push('Slack')

  return uniq(systems)
}

function inferSecurityModel(description = '', labels = []) {
  const text = `${description}\n${toArray(labels).join('\n')}`.toLowerCase()
  if (/jwt/.test(text) || /oauth/.test(text)) {
    return {
      type: 'jwt-bearer',
      preserveExactPattern: true,
      description: 'Preserve the current JWT/OAuth exchange behind the generated Mule app.'
    }
  }

  if (/client[_\s-]?id|client[_\s-]?secret/.test(text)) {
    return {
      type: 'client-credentials',
      preserveExactPattern: false,
      description: 'Use client_id/client_secret enforcement for inbound and downstream calls.'
    }
  }

  return {
    type: 'managed-policy',
    preserveExactPattern: false,
    description: 'Use managed policy defaults and document any downstream auth hooks.'
  }
}

function inferTargetApiLayer(summary = '', description = '', labels = [], downstreamSystems = []) {
  const text = `${summary}\n${description}\n${toArray(labels).join('\n')}`.toLowerCase()
  if (/experience api|\bexp[-\s]/.test(text)) return 'experience'
  if (/process api|\bprc[-\s]|orchestrat|compose/.test(text)) return 'process'
  if (/system api|\bsys[-\s]|connector|backend/.test(text)) return 'system'
  return downstreamSystems.length > 1 ? 'process' : 'system'
}

function inferCapability({ summary = '', description = '', labels = [] }) {
  const explicitCapability =
    safeJsonParse(collectMarkdownSection(description, 'Capability')) ||
    collectMarkdownSection(description, 'Capability')

  if (typeof explicitCapability === 'string' && explicitCapability.trim()) {
    return slugify(explicitCapability)
  }

  if (labels.some((label) => /contact/i.test(label))) return 'contact-details'
  return inferCapabilityFromSummary(summary)
}

function normalizeTicket(ticket = {}) {
  return stripEmpty({
    key: ticket.key || ticket.id || null,
    summary: ticket.summary || '',
    description: ticket.description || '',
    acceptanceCriteria: ticket.acceptanceCriteria || '',
    labels: uniq(ticket.labels || []),
    comments: toArray(ticket.comments).map((comment) => String(comment)),
    attachments: toArray(ticket.attachments),
    links: toArray(ticket.links)
  })
}

function normalizeWorkOrder(input = {}) {
  const operations = toArray(input.operations).map(normalizeOperationShape)
  const downstreamSystems = uniq(input.downstreamSystems || [])

  return stripEmpty({
    capability: input.capability || null,
    targetApiLayer: input.targetApiLayer || null,
    downstreamSystems,
    operations,
    securityModel: input.securityModel || null,
    successCriteria: uniq(input.successCriteria || []),
    architectureHints: uniq(input.architectureHints || []),
    referenceRepos: uniq(input.referenceRepos || []),
    multiApi: input.multiApi === true
  })
}

export function readJiraTicketArtifact(input = {}) {
  const ticket = normalizeTicket(input.ticket || {})
  const providedWorkOrder = normalizeWorkOrder(input.workOrder || {})
  const context = input.context || {}

  if (providedWorkOrder.capability && providedWorkOrder.operations.length > 0) {
    return {
      source: 'work-order',
      ticket,
      workOrder: {
        ...providedWorkOrder,
        sourceTicket: ticket.key || null
      }
    }
  }

  const description = ticket.description || ''
  const operations = toArray(context.operations).length > 0
    ? toArray(context.operations).map(normalizeOperationShape)
    : parseOperationBullets(description)

  const downstreamSystems = uniq(context.downstreamSystems || inferDownstreamSystems(description, ticket.labels))
  const successCriteria = uniq(
    context.successCriteria ||
      extractBullets(collectMarkdownSection(description, 'Success Criteria')) ||
      extractBullets(ticket.acceptanceCriteria)
  )

  const workOrder = {
    sourceTicket: ticket.key || null,
    capability: context.capability || inferCapability(ticket),
    targetApiLayer: context.targetApiLayer || inferTargetApiLayer(ticket.summary, description, ticket.labels, downstreamSystems),
    downstreamSystems,
    operations,
    securityModel: context.securityModel || inferSecurityModel(description, ticket.labels),
    successCriteria,
    architectureHints: uniq(context.architectureHints || []),
    referenceRepos: uniq(context.referenceRepos || []),
    multiApi: context.multiApi === true
  }

  return {
    source: 'ticket',
    ticket,
    workOrder
  }
}
