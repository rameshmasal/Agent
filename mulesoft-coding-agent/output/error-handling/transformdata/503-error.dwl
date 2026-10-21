%dw 2.0
output application/json
---
{
  "error": {
    "code": "503",
    "status": "SERVICE_UNAVAILABLE",
    "message": "A backend system is currently unavailable. Please try again later.",
    "correlationId": vars.correlationId default "",
    "timestamp": now() as String {format: "yyyy-MM-dd'T'HH:mm:ss.SSSZ"}
  }
}
