%dw 2.0
output application/json
---
{
  "error": {
    "code": vars.httpStatus as String,
    "status": "MQ_REJECTED",
    "message": "$(p('application-msgs.msg-mq-unexpected-status')) $(vars.mqResponse.attributes.statusCode)",
    "downstreamCode": vars.mqResponse.attributes.statusCode,
    "correlationId": vars.correlationId default correlationId
  }
}
