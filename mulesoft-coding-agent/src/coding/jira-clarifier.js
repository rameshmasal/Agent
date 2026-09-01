import { titleCase } from './utils.js'

export function clarifyWorkOrder(workOrder = {}) {
  const blocking = []
  const advisory = []

  if (!workOrder.capability) blocking.push('Capability name is missing.')
  if (!workOrder.operations || workOrder.operations.length === 0) {
    blocking.push('At least one API operation is required before RAML generation can begin.')
  }
  if (!workOrder.downstreamSystems || workOrder.downstreamSystems.length === 0) {
    blocking.push('At least one downstream system must be identified.')
  }

  for (const operation of workOrder.operations || []) {
    if (!operation.method) blocking.push(`Operation ${operation.name || operation.path || 'unknown'} is missing an HTTP method.`)
    if (!operation.path) blocking.push(`Operation ${operation.name || operation.method || 'unknown'} is missing a path.`)
  }

  if (!workOrder.securityModel) {
    advisory.push('Security model was not provided. A managed policy default will be used in the generated guidance.')
  }
  if (!workOrder.targetApiLayer) {
    advisory.push('Target API layer was not provided. The architecture adapter will infer it from the ticket context.')
  }
  if (!workOrder.successCriteria || workOrder.successCriteria.length === 0) {
    advisory.push('Success criteria were not provided. Generated validation will use operation-level defaults.')
  }

  const questions = blocking.map((item) => ({
    title: `${titleCase(workOrder.capability || 'generated capability')} clarification`,
    prompt: item
  }))

  return {
    status: blocking.length > 0 ? 'blocked-for-clarification' : 'ready',
    blocking,
    advisory,
    questions,
    resolvedDefaults: {
      targetApiLayer: workOrder.targetApiLayer || null,
      securityModel: workOrder.securityModel || {
        type: 'managed-policy',
        preserveExactPattern: false,
        description: 'Use managed policy defaults until the exact auth model is confirmed.'
      }
    }
  }
}
