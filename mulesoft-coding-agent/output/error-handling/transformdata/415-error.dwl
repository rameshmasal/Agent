%dw 2.0
output application/json
---
{
  "error": {
    "code": "415",
    "status": "UNSUPPORTED_MEDIA_TYPE",
    "message": "Request Content-Type is not supported by this endpoint.",
    "correlationId": vars.correlationId default "",
    "timestamp": now() as String {format: "yyyy-MM-dd'T'HH:mm:ss.SSSZ"}
  }
}