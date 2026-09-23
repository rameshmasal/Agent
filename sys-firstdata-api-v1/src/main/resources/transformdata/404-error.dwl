%dw 2.0
output application/json
---
{
    "error": {
        "code":    "404",
        "status":  "NOT_FOUND",
        "message": error.description default "Resource Not Found"
    }
}
