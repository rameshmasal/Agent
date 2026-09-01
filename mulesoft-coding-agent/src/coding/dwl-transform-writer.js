import { operationSlug, toPrettyJson } from './utils.js'

function renderDwlFromJson(example) {
  return `%dw 2.0\noutput application/json\n---\n${JSON.stringify(example ?? {}, null, 2)}\n`
}

export function writeDwlTransforms({ workOrder }) {
  const files = {}

  for (const operation of workOrder.operations || []) {
    const slug = operationSlug(operation)
    files[`src/main/resources/transformdata/${slug}-mock-response.dwl`] = renderDwlFromJson(
      operation.responseBody.example
    )

    if (operation.requestBody?.example) {
      files[`src/main/resources/transformdata/${slug}-request.dwl`] = renderDwlFromJson(
        operation.requestBody.example
      )
    }

    files[`src/test/resources/${slug}-response.json`] = toPrettyJson(operation.responseBody.example)
  }

  return { files }
}
