%dw 2.0
output application/json
---
{
  "error": {
    "code": "503",
    "status": "SERVICE_UNAVAILABLE",
    "message": "Anypoint MQ or the token service is unreachable.",
    "correlationId": vars.correlationId default correlationId
  }
}
