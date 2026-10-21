%dw 2.0
output application/json
---
{
  "error": {
    "code": "400",
    "status": "BAD_REQUEST",
    "message": "Invalid or missing required query parameter.",
    "correlationId": vars.correlationId default "",
    "timestamp": now() as String {format: "yyyy-MM-dd'T'HH:mm:ss.SSSZ"}
  }
}