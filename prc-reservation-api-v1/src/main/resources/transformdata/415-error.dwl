%dw 2.0
output application/json
---
{
    "error": {
        "code":    "415",
        "status":  "UNSUPPORTED_MEDIA_TYPE",
        "message": error.description default "Unsupported Media Type"
    }
}
