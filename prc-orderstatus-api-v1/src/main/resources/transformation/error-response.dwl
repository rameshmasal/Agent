%dw 2.0
output application/json
---
{
	"status": "Failure",
	"status-code": "500",
	"message": error.description default "Internal server error"
}
