%dw 2.0
output application/json
---
{
  "error": {
    "code": "501",
    "status": "NOT_IMPLEMENTED",
    "message": "The requested functionality is not implemented in this API.",
    "correlationId": vars.correlationId default "",
    "timestamp": now() as String {format: "yyyy-MM-dd'T'HH:mm:ss.SSSZ"}
  }
}