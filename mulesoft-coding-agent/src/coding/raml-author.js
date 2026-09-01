import {
  buildArtifactId,
  buildRepoName,
  ensureLeadingSlash,
  inferPrimitiveType,
  operationSlug,
  titleCase,
  toPrettyJson
} from './utils.js'

function renderTypeProperties(example, indent = '  ') {
  return Object.entries(example || {})
    .map(([key, value]) => {
      const primitiveType = inferPrimitiveType(value)
      if (primitiveType === 'object') {
        return `${indent}${key}:\n${indent}  type: object\n${indent}  properties:\n${renderTypeProperties(value, `${indent}    `)}`
      }

      if (primitiveType === 'array') {
        const firstEntry = value[0] ?? ''
        const itemType = inferPrimitiveType(firstEntry)
        return `${indent}${key}:\n${indent}  type: array\n${indent}  items:\n${indent}    type: ${itemType === 'integer' ? 'number' : itemType}`
      }

      const normalizedType = primitiveType === 'integer' ? 'number' : primitiveType
      return `${indent}${key}:\n${indent}  type: ${normalizedType}`
    })
    .join('\n')
}

function renderTypeFile(example, description) {
  return `#%RAML 1.0 DataType\n` +
    `description: ${description}\n` +
    `type: object\n` +
    `properties:\n${renderTypeProperties(example, '  ')}\n`
}

function renderQueryParameters(queryParameters = []) {
  if (!queryParameters.length) return ''

  const lines = ['    queryParameters:']
  for (const parameter of queryParameters) {
    lines.push(`      ${parameter.name}:`)
    lines.push(`        type: ${parameter.type || 'string'}`)
    lines.push(`        required: ${parameter.required !== false}`)
    if (parameter.description) lines.push(`        description: ${parameter.description}`)
  }
  return `${lines.join('\n')}\n`
}

function renderOperationBlock(operation, artifactId) {
  const requestTypePath = `types/${operationSlug(operation)}-request.raml`
  const responseTypePath = `types/${operationSlug(operation)}-response.raml`
  const requestExamplePath = `example/${operationSlug(operation)}-request.json`
  const responseExamplePath = `example/${operationSlug(operation)}-response.json`
  const queryParametersBlock = renderQueryParameters(operation.queryParameters)
  const bodyBlock = operation.requestBody
    ? `    body:\n      application/json:\n        type: !include ${requestTypePath}\n        example: !include ${requestExamplePath}\n`
    : ''

  return {
    block:
      `${ensureLeadingSlash(operation.path)}:\n` +
      `  ${String(operation.method || 'GET').toLowerCase()}:\n` +
      `    description: ${operation.summary}\n` +
      queryParametersBlock +
      bodyBlock +
      `    responses:\n` +
      `      ${operation.responseBody.statusCode}:\n` +
      `        body:\n` +
      `          application/json:\n` +
      `            type: !include ${responseTypePath}\n` +
      `            example: !include ${responseExamplePath}\n`,
    requestTypePath,
    responseTypePath,
    requestExamplePath,
    responseExamplePath
  }
}

export function authorRaml({ workOrder, architecture }) {
  const artifactId = buildArtifactId({
    apiLayer: architecture.apiLayer,
    capability: workOrder.capability
  })
  const repoName = buildRepoName(artifactId)
  const title = artifactId
  const ramlFileName = `${artifactId}.raml`
  const documentationTitle = `${titleCase(workOrder.capability)} ${titleCase(architecture.apiLayer)} API`

  const operationArtifacts = (workOrder.operations || []).map((operation) => ({
    operation,
    ...renderOperationBlock(operation, artifactId)
  }))

  const ramlLines = [
    '#%RAML 1.0',
    'baseUri: https://anypoint.mulesoft.com/mocking/api/v1/links/placeholder',
    'version: v1.0',
    `title: ${title}`,
    'protocols: HTTPS',
    'mediaType: application/json',
    'documentation:',
    `  - title: ${documentationTitle}`,
    `    content: Generated from Jira ticket ${workOrder.sourceTicket || 'manual input'} by mulesoft-coding-agent.`,
    ''
  ]

  const files = {
    [`src/main/resources/api/${ramlFileName}`]:
      `${ramlLines.join('\n')}\n${operationArtifacts.map((artifact) => artifact.block).join('\n')}`
  }

  for (const artifact of operationArtifacts) {
    if (artifact.operation.requestBody) {
      files[`src/main/resources/api/${artifact.requestTypePath}`] = renderTypeFile(
        artifact.operation.requestBody.example,
        `${artifact.operation.summary} request`
      )
      files[`src/main/resources/api/${artifact.requestExamplePath}`] = toPrettyJson(
        artifact.operation.requestBody.example
      )
    }

    files[`src/main/resources/api/${artifact.responseTypePath}`] = renderTypeFile(
      artifact.operation.responseBody.example,
      `${artifact.operation.summary} response`
    )
    files[`src/main/resources/api/${artifact.responseExamplePath}`] = toPrettyJson(
      artifact.operation.responseBody.example
    )
  }

  return {
    appDescriptor: {
      artifactId,
      repoName,
      ramlFileName,
      capabilitySlug: workOrder.capability,
      apiLayer: architecture.apiLayer
    },
    files,
    operations: operationArtifacts.map((artifact) => ({
      name: artifact.operation.name,
      method: artifact.operation.method,
      path: artifact.operation.path,
      requestTypePath: artifact.requestTypePath,
      responseTypePath: artifact.responseTypePath
    }))
  }
}
