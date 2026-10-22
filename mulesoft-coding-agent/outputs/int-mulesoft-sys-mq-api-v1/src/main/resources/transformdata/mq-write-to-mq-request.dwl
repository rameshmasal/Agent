%dw 2.0
output application/json
var mediaType = (payload.^mimeType default "") as String
// JSON is re-serialised (fails when invalid); XML is converted to its JSON form; text must itself be JSON
var asJson = if (isEmpty(payload)) fail("Request body is empty")
             else if (mediaType contains "json") payload
             else if (mediaType contains "xml") payload
             else read(payload as String, "application/json")
---
{
  body: write(asJson, "application/json")
}
