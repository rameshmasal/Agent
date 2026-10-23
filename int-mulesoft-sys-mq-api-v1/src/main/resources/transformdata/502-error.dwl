%dw 2.0
output application/json
---
{
  "error": {
    "code": "502",
    "status": "BAD_GATEWAY",
    "message": "Anypoint MQ or the token service returned an unexpected response.",
    "correlationId": vars.correlationId default correlationId
  }
}
