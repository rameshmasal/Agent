%dw 2.0
output application/json
---
{
    "error": {
        "code":    "405",
        "status":  "METHOD_NOT_ALLOWED",
        "message": error.description default "Method Not Allowed"
    }
}
