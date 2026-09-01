import { expandTokens } from './utils.js'

function inferLayer(workOrder = {}) {
  if (workOrder.targetApiLayer) return workOrder.targetApiLayer
  if ((workOrder.downstreamSystems || []).length > 1) return 'process'

  const tokens = expandTokens([
    workOrder.capability,
    ...(workOrder.architectureHints || []),
    ...(workOrder.downstreamSystems || [])
  ])

  if (tokens.includes('experience')) return 'experience'
  if (tokens.includes('process') || tokens.includes('orchestrate')) return 'process'
  return 'system'
}

export function adaptArchitectureRecommendation({ workOrder, existingApiScan }) {
  const apiLayer = inferLayer(workOrder)
  const requiresMultipleApis = workOrder.multiApi === true || (workOrder.architectureHints || []).includes('multi-api')

  let decision = 'create new API'
  if (apiLayer === 'system' && existingApiScan.extensionCandidate?.score >= 3) {
    decision = 'extend existing System API'
  } else if (existingApiScan.closestReusableAsset?.score >= 5) {
    decision = `reuse existing ${existingApiScan.closestReusableAsset.apiLayer} API`
  }

  const topology =
    apiLayer === 'process'
      ? 'experience->process->system'
      : apiLayer === 'experience'
        ? 'experience->process/system'
        : 'system-only'

  const securityRecommendation =
    workOrder.securityModel?.type === 'jwt-bearer'
      ? 'Preserve the current JWT bearer or OAuth exchange pattern behind the generated Mule app and keep the exact auth hook explicit.'
      : workOrder.securityModel?.description || 'Use managed API policies plus explicit downstream auth hooks where needed.'

  const implementationNotes = [
    'Use RAML as the source of truth.',
    'Keep existing Mule repos read-only and surface extension guidance separately.',
    'Generate a new ACB-importable Mule app even when an extension candidate exists.'
  ]

  return {
    apiLayer,
    decision,
    topology,
    securityRecommendation,
    mockModeFeasible: true,
    requiresMultipleApis,
    generationMode: decision === 'create new API' ? 'create-new' : 'new-app-with-extension-guidance',
    principlesApplied: [
      'layer-role-clarity',
      'design-first-reuse',
      'governance-by-ruleset',
      'asset-instance-separation'
    ],
    implementationNotes,
    stopReason: requiresMultipleApis
      ? 'This ticket indicates multiple coordinated APIs, so the v1 agent should stop after planning output.'
      : null
  }
}
