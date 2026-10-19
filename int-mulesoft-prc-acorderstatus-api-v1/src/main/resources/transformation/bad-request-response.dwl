%dw 2.0
output application/json
---
{
	"status": "Failure",
	"status-code": "400",
	"message": error.description default "Bad request"
}
