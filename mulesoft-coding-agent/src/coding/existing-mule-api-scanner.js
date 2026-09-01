import fs from 'node:fs'
import path from 'node:path'
import {
  expandTokens,
  readFileIfExists,
  scoreTokenOverlap,
  slugify,
  tokenize,
  uniq
} from './utils.js'

function inferRepoLayer(repoName = '') {
  if (/-exp-/.test(repoName)) return 'experience'
  if (/-prc-/.test(repoName)) return 'process'
  return 'system'
}

function readRepoKeywords(repoPath, repoName) {
  const tokens = new Set(tokenize(repoName))
  const readme = readFileIfExists(path.join(repoPath, 'README.md'))
  const pom = readFileIfExists(path.join(repoPath, 'pom.xml'))
  const apiDir = path.join(repoPath, 'src', 'main', 'resources', 'api')

  for (const token of tokenize(readme || '')) tokens.add(token)
  for (const token of tokenize(pom || '')) tokens.add(token)

  if (fs.existsSync(apiDir)) {
    for (const fileName of fs.readdirSync(apiDir)) {
      for (const token of tokenize(fileName)) tokens.add(token)
    }
  }

  return [...tokens]
}

function readArtifactId(repoPath) {
  const pom = readFileIfExists(path.join(repoPath, 'pom.xml')) || ''
  return pom.match(/<artifactId>([^<]+)<\/artifactId>/)?.[1] || path.basename(repoPath)
}

function collectRepoMetadata(workspaceRoot, repoName) {
  const repoPath = path.join(workspaceRoot, repoName)
  return {
    repoName,
    repoPath,
    apiLayer: inferRepoLayer(repoName),
    artifactId: readArtifactId(repoPath),
    keywords: readRepoKeywords(repoPath, repoName)
  }
}

function buildTargetTokens(workOrder = {}) {
  return uniq(
    expandTokens([
      workOrder.capability,
      workOrder.targetApiLayer,
      ...(workOrder.downstreamSystems || []),
      ...(workOrder.operations || []).map((operation) => `${operation.method} ${operation.path}`)
    ])
  )
}

export function scanExistingMuleApis({ workspaceRoot, workOrder }) {
  const directories = fs
    .readdirSync(workspaceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('int-mulesoft-'))
    .map((entry) => entry.name)

  const repos = directories.map((repoName) => collectRepoMetadata(workspaceRoot, repoName))
  const targetTokens = buildTargetTokens(workOrder)

  const rankedCandidates = repos
    .map((repo) => {
      const score = scoreTokenOverlap(targetTokens, expandTokens(repo.keywords))
      const layerBonus = workOrder.targetApiLayer && repo.apiLayer === workOrder.targetApiLayer ? 2 : 0
      return {
        ...repo,
        score: score + layerBonus
      }
    })
    .sort((left, right) => right.score - left.score)

  const closestReusableAsset = rankedCandidates.find((candidate) => candidate.score > 0) || null
  const extensionCandidate =
    rankedCandidates.find(
      (candidate) =>
        candidate.score > 0 &&
        candidate.apiLayer === (workOrder.targetApiLayer || candidate.apiLayer)
    ) || closestReusableAsset

  const capabilitySlug = slugify(workOrder.capability || 'generated-capability')
  const whyNotReuseAsIs = extensionCandidate
    ? `The closest existing repo is ${extensionCandidate.repoName}, but v1 generates a new standalone app per ticket and treats existing Mule repos as read-only references.`
    : `No strong existing Mule repo match was found for ${capabilitySlug}, so a new app is still the safest v1 output.`

  const newAppStillRequired =
    'This agent is scoped to produce one new deployable Mule app per ticket while separately reporting which existing asset could be reused or extended later.'

  return {
    scannedRepoCount: repos.length,
    targetTokens,
    closestReusableAsset,
    extensionCandidate,
    whyNotReuseAsIs,
    newAppStillRequired,
    candidates: rankedCandidates.slice(0, 5)
  }
}
