%dw 2.0
output application/json
---
{
    "error": {
        "code":    "406",
        "status":  "NOT_ACCEPTABLE",
        "message": error.description default "Not Acceptable"
    }
}
