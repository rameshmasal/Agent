%dw 2.0
output application/json
---
{
  messageId: vars.messageId,
  queueName: vars.queueName,
  status: "QUEUED",
  correlationId: vars.correlationId
}
