%dw 2.0
output application/json
---
{
  "error": {
    "code": "500",
    "status": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred. Please contact support.",
    "correlationId": vars.correlationId default "",
    "timestamp": now() as String {format: "yyyy-MM-dd'T'HH:mm:ss.SSSZ"}
  }
}
