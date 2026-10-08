%dw 2.0
output application/json
var row = payload[0]
---
{
	"orderId": row.order_id,
	"brand": row.brand,
	"siteId": row.site_id,
	"latestEventNumber": row.latest_event_number,
	"latestEventOccuredAt": row.latest_event_occured_at as String,
	"orderStatus": row.order_status,
	"orderSnapshot": if (row.order_snapshot != null) read(row.order_snapshot as String, "application/json") else null,
	"createdAt": row.created_at as String,
	"updatedAt": row.updated_at as String,
	"transactionNumber": row.transaction_number
}
