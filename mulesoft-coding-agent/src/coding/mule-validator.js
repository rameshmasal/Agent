function findResourceReferences(xml = '') {
  return [...xml.matchAll(/resource="([^"]+)"/g)].map((match) => match[1])
}

export function validateGeneratedProject({ appDescriptor, files, workOrder }) {
  const errors = []
  const warnings = []
  const requiredFiles = [
    'pom.xml',
    'mule-artifact.json',
    `src/main/resources/api/${appDescriptor.ramlFileName}`,
    'src/main/mule/cf-global.xml',
    'src/main/mule/pf-router.xml',
    `src/main/mule/rf-${appDescriptor.capabilitySlug}.xml`
  ]

  for (const relativePath of requiredFiles) {
    if (!files[relativePath]) errors.push(`Missing required generated file: ${relativePath}`)
  }

  const allFilePaths = new Set(Object.keys(files))
  for (const [relativePath, contents] of Object.entries(files)) {
    if (!relativePath.endsWith('.xml')) continue
    for (const reference of findResourceReferences(contents)) {
      const normalized = `src/main/resources/${reference}`
      if (!allFilePaths.has(normalized)) {
        errors.push(`${relativePath} references missing resource ${normalized}`)
      }
    }
  }

  if (!workOrder.operations || workOrder.operations.length === 0) {
    errors.push('No operations were available for generated project validation.')
  }

  if (!files[`src/test/munit/${appDescriptor.artifactId}-test-suite.xml`]) {
    warnings.push('MUnit smoke test suite was not generated.')
  }

  return {
    status: errors.length > 0 ? 'failed' : 'passed',
    checks: [
      'required-file-layout',
      'resource-reference-integrity',
      'operation-presence',
      'munit-suite-presence'
    ],
    acbImportable: errors.length === 0,
    mockModeReady: Boolean(files['src/main/resources/properties/local.yaml']),
    errors,
    warnings,
    notes: [
      'Validation in this scaffold is static and local.',
      'Maven package and full MUnit execution should be attached in a later runtime-enabled revision.'
    ]
  }
}
