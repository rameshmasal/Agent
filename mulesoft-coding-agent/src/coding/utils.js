import fs from 'node:fs'
import path from 'node:path'

const TOKEN_SYNONYMS = Object.freeze({
  salesforce: ['salesforce', 'sfsc', 'sfscnwl', 'service', 'cloud'],
  slack: ['slack', 'teams', 'message', 'notification'],
  sftp: ['sftp', 'file', 'files'],
  notification: ['notification', 'notify', 'jira', 'email'],
  contact: ['contact', 'contacts', 'profile'],
  order: ['order', 'orders', 'oms'],
  product: ['product', 'catalog', 'pricebook'],
  email: ['email', 'mail'],
  jira: ['jira', 'issue', 'ticket']
})

export function toArray(value) {
  if (value == null) return []
  return Array.isArray(value) ? value.filter(Boolean) : [value]
}

export function uniq(values) {
  return [...new Set(toArray(values).flat().filter(Boolean))]
}

export function slugify(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function titleCase(value = '') {
  return String(value)
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ')
}

export function ensureLeadingSlash(value = '') {
  const normalized = String(value || '').trim()
  if (!normalized) return '/'
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

export function stripEmpty(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry != null))
}

export function extractBullets(value = '') {
  return String(value)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, '').trim())
    .filter(Boolean)
}

export function tokenize(value = '') {
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1)
}

export function expandTokens(values = []) {
  const tokens = new Set()
  for (const value of toArray(values)) {
    for (const token of tokenize(value)) {
      tokens.add(token)
      if (TOKEN_SYNONYMS[token]) {
        for (const synonym of TOKEN_SYNONYMS[token]) tokens.add(synonym)
      }
    }
  }

  for (const [key, synonyms] of Object.entries(TOKEN_SYNONYMS)) {
    if (tokens.has(key) || synonyms.some((synonym) => tokens.has(synonym))) {
      tokens.add(key)
      for (const synonym of synonyms) tokens.add(synonym)
    }
  }

  return [...tokens]
}

export function inferCapabilityFromSummary(summary = '') {
  const slug = slugify(summary.replace(/\b(create|build|generate|implement|migrate|api|system|process|experience)\b/gi, ''))
  return slug || 'generated-capability'
}

export function layerPrefix(apiLayer = 'system') {
  if (apiLayer === 'process') return 'prc'
  if (apiLayer === 'experience') return 'exp'
  return 'sys'
}

export function buildArtifactId({ apiLayer = 'system', capability = 'generated-capability' }) {
  return `${layerPrefix(apiLayer)}-${slugify(capability)}-api-v1`
}

export function buildRepoName(artifactId) {
  return `int-mulesoft-${artifactId}`
}

export function buildAppConfigKey(artifactId) {
  return artifactId
}

export function buildApikitFlowName(operation, routerConfigName) {
  const method = String(operation.method || 'GET').toLowerCase()
  const pathPart = ensureLeadingSlash(operation.path)
    .split('/')
    .filter(Boolean)
    .map((segment) => `\\${segment}`)
    .join('')
  const requestMediaType = operation.requestBody?.contentType
    ? `:${String(operation.requestBody.contentType).replace(/\//g, '\\')}`
    : ''

  return `${method}:${pathPart || '\\'}${requestMediaType}:${routerConfigName}`
}

export function operationSlug(operation) {
  return slugify(`${operation.method || 'op'} ${operation.path || '/resource'}`)
}

export function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function toPrettyJson(value) {
  return `${JSON.stringify(value ?? {}, null, 2)}\n`
}

export function writeFileMap(rootDir, files) {
  for (const [relativePath, contents] of Object.entries(files)) {
    const absolutePath = path.join(rootDir, relativePath)
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
    fs.writeFileSync(absolutePath, contents)
  }
}

export function readFileIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null
  return fs.readFileSync(filePath, 'utf8')
}

export function safeJsonParse(value, fallback = null) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function collectMarkdownSection(text = '', heading = '') {
  if (!text || !heading) return ''
  const lines = String(text).split('\n')
  const sectionLines = []
  let collecting = false
  const headingPattern = new RegExp(`^#{1,6}\\s+${heading}\\s*$`, 'i')

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    if (headingPattern.test(line)) {
      collecting = true
      continue
    }
    if (collecting && /^#{1,6}\s+/.test(line)) break
    if (collecting) sectionLines.push(rawLine)
  }

  return sectionLines.join('\n').trim()
}

export function inferPrimitiveType(value) {
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number' && Number.isInteger(value)) return 'integer'
  if (typeof value === 'number') return 'number'
  if (Array.isArray(value)) return 'array'
  if (value && typeof value === 'object') return 'object'
  return 'string'
}

export function scoreTokenOverlap(targetTokens = [], repoTokens = []) {
  const repoTokenSet = new Set(repoTokens)
  let score = 0
  for (const token of targetTokens) {
    if (repoTokenSet.has(token)) score += 1
  }
  return score
}
