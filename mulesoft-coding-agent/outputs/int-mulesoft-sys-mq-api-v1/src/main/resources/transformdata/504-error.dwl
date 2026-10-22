%dw 2.0
output application/json
---
{
  "error": {
    "code": "504",
    "status": "GATEWAY_TIMEOUT",
    "message": "Anypoint MQ or the token service timed out.",
    "correlationId": vars.correlationId default correlationId
  }
}
