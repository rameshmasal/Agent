%dw 2.0
output application/json
---
{
  "error": {
    "code": "404",
    "status": "NOT_FOUND",
    "message": "HTTP method/endpoint not found.",
    "correlationId": vars.correlationId default "",
    "timestamp": now() as String {format: "yyyy-MM-dd'T'HH:mm:ss.SSSZ"}
  }
}