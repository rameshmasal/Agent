%dw 2.0
output application/json
---
{
    "error": {
        "code":    "400",
        "status":  "BAD_REQUEST",
        "message": error.description default "Bad Request"
    }
}
