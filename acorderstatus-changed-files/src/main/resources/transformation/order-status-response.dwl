%dw 2.0
output application/json
var row = payload[0]
// The System API may return the snapshot as JSON text or as an already-parsed (jsonb) object
fun snapshot(raw) = raw match {
	case s is String -> read(s, "application/json")
	case o is Object -> if (o.value?) (if (o.value is String) read(o.value, "application/json") else o.value) else o
	else -> null
}
---
// An empty snapshot never gets here: the flow answers it with order-not-found.dwl
snapshot(row.order_snapshot)
