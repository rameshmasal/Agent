%dw 2.0
output application/json
---
{
  "error": {
    "code": "504",
    "status": "GATEWAY_TIMEOUT",
    "message": "A backend system did not respond in time. Please try again later.",
    "correlationId": vars.correlationId default "",
    "timestamp": now() as String {format: "yyyy-MM-dd'T'HH:mm:ss.SSSZ"}
  }
}
