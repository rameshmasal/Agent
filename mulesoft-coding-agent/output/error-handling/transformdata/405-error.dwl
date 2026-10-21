%dw 2.0
output application/json
---
{
  "error": {
    "code": "405",
    "status": "METHOD_NOT_ALLOWED",
    "message": "HTTP method not supported for this endpoint.",
    "correlationId": vars.correlationId default "",
    "timestamp": now() as String {format: "yyyy-MM-dd'T'HH:mm:ss.SSSZ"}
  }
}