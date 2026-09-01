import { operationSlug, toPrettyJson } from './utils.js'

function renderTestCase(operation) {
  const slug = operationSlug(operation)
  const payloadExpression = `#[readUrl('classpath://examples/${slug}-request.json', 'application/json')]`

  return (
    `  <munit:test name="${slug}-smoke-test" description="Smoke test for ${operation.summary}">\n` +
    `    <munit:execution>\n` +
    `      <munit:set-event>\n` +
    `        <munit:payload value="${payloadExpression}" mediaType="application/json" />\n` +
    `      </munit:set-event>\n` +
    `      <flow-ref name="rf-${slug}" />\n` +
    `    </munit:execution>\n` +
    `    <munit:validation>\n` +
    `      <munit-tools:assert-that expression="#[payload]" is="#[MunitTools::notNullValue()]" />\n` +
    `    </munit:validation>\n` +
    `  </munit:test>\n`
  )
}

export function authorMunitTests({ appDescriptor, workOrder }) {
  const testCases = (workOrder.operations || []).map(renderTestCase).join('\n')
  const suite =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<mule xmlns:munit="http://www.mulesoft.org/schema/mule/munit"\n` +
    `  xmlns:munit-tools="http://www.mulesoft.org/schema/mule/munit-tools"\n` +
    `  xmlns="http://www.mulesoft.org/schema/mule/core"\n` +
    `  xmlns:doc="http://www.mulesoft.org/schema/mule/documentation"\n` +
    `  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n` +
    `  xsi:schemaLocation="\n` +
    `http://www.mulesoft.org/schema/mule/core http://www.mulesoft.org/schema/mule/core/current/mule.xsd\n` +
    `http://www.mulesoft.org/schema/mule/munit http://www.mulesoft.org/schema/mule/munit/current/mule-munit.xsd\n` +
    `http://www.mulesoft.org/schema/mule/munit-tools http://www.mulesoft.org/schema/mule/munit-tools/current/mule-munit-tools.xsd">\n` +
    `  <munit:config name="${appDescriptor.artifactId}-test-suite" />\n` +
    `${testCases}` +
    `</mule>\n`

  const files = {
    [`src/test/munit/${appDescriptor.artifactId}-test-suite.xml`]: suite
  }

  for (const operation of workOrder.operations || []) {
    const slug = operationSlug(operation)
    const examplePayload = operation.requestBody?.example || {}
    files[`src/test/resources/examples/${slug}-request.json`] = toPrettyJson(examplePayload)
  }

  return { files }
}
