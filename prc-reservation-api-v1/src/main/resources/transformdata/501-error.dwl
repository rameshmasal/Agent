%dw 2.0
output application/json
---
{
    "error": {
        "code":    "501",
        "status":  "NOT_IMPLEMENTED",
        "message": error.description default "Not Implemented"
    }
}
