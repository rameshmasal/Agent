%dw 2.0
output application/json
---
{
  "error": {
    "code": "406",
    "status": "NOT_ACCEPTABLE",
    "message": "Requested response format is not supported by this endpoint.",
    "correlationId": vars.correlationId default "",
    "timestamp": now() as String {format: "yyyy-MM-dd'T'HH:mm:ss.SSSZ"}
  }
}