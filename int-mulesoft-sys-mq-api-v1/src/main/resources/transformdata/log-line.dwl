%dw 2.0
output text/plain
var maxChars = p('logging.max-payload-chars') as Number
var raw = vars.logPayload
var text = if (raw == null) "" else (if (raw is String) raw else write(raw, "application/json", {indent: false}))
var oneLine = text replace /\s*[\r\n]+\s*/ with " "
var body = if (sizeOf(oneLine) > maxChars) (oneLine[0 to maxChars - 1] ++ "...[truncated]") else oneLine
var queue = vars.queueName default "n/a"
var msgId = vars.messageId default "n/a"
var corrId = vars.correlationId default correlationId
---
vars.logType match {
    case "API_REQUEST"  -> "$(p('logging.messages.api-request')) $(queue) - messageId=$(msgId), correlationId=$(corrId), payload: $(body)"
    case "MQ_REQUEST"   -> "$(p('logging.messages.mq-request')) $(queue) - messageId=$(msgId), correlationId=$(corrId), envelope: $(body)"
    case "MQ_RESPONSE"  -> "$(p('logging.messages.mq-response')) $(vars.logStatus default '') for queue $(queue) - messageId=$(msgId), correlationId=$(corrId), response: $(body)"
    case "API_RESPONSE" -> "$(p('logging.messages.api-response')) $(vars.logStatus default '') for queue $(queue) - messageId=$(msgId), correlationId=$(corrId), response: $(body)"
    case "ERROR"        -> "$(p('logging.messages.error')) $(vars.logStatus default '') for queue $(queue) - messageId=$(msgId), correlationId=$(corrId), $(body)"
    else                -> "$(vars.logType default 'EVENT') - correlationId=$(corrId), $(body)"
}
