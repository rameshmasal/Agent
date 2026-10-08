%dw 2.0
output application/json
---
{
	"status": "Failure",
	"status-code": "404",
	"message": "Order not found: " ++ (vars.orderId default "")
}
