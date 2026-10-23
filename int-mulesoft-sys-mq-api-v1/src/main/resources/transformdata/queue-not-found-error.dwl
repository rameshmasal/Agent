%dw 2.0
output application/json
---
{
  "error": {
    "code": "404",
    "status": "NOT_FOUND",
    "message": "$(p('application-msgs.msg-queue-not-found')) $(vars.queueName)",
    "correlationId": vars.correlationId default correlationId
  }
}
