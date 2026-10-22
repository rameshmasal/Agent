%dw 2.0
output application/json
---
{
  "error": {
    "code": "500",
    "status": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected error while processing the request.",
    "correlationId": vars.correlationId default correlationId
  }
}
