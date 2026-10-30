%dw 2.0
output application/json
---
// UCP business error: HTTP 200 with ucp.status "error" (UCP 2026-04-08, Get Order)
{
	"ucp": {
		"version": "2026-04-08",
		"status": "error"
	},
	"messages": [
		{
			"type": "error",
			"code": "not_found",
			"content": "Order not found",
			"severity": "unrecoverable"
		}
	]
}
