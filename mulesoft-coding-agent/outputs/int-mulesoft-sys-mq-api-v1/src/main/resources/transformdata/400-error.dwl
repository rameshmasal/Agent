%dw 2.0
output application/json
---
{
  "error": {
    "code": "400",
    "status": "BAD_REQUEST",
    "message": "Invalid request.",
    "correlationId": vars.correlationId default correlationId
  }
}
