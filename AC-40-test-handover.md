---
title: "AC 40: Get Order endpoint, test handover"
---

**Story:** Google UCP | Order Lifecycle API | Get Order Mulesoft Endpoint

**As** Google UCP (the API consumer), **I want** to call `GET /orders/{id}`, **so that** I can retrieve the latest snapshot of an order's status on demand.

## What the API does

The API reads the latest order snapshot from the database and returns it unchanged. It is the UCP order entity most recently sent to Google by the order-lifecycle webhooks, so its content is only as complete and as current as those webhooks made it.

## How it is called

Each brand (Graco, Yankee Candle) has its own Flex Gateway proxy. Test through the brand's gateway, not against the API directly.

The gateway:

- validates the OAuth JWT and enforces TLS 1.3
- rewrites `GET /orders/{id}` to the API's `GET /order/{orderId}`
- sets the `brand` header (`gracobaby` or `yankeecandle`), overwriting any value from the caller

## Acceptance criteria

1. Expose `GET /orders/{id}` with a required string order ID. Serve the endpoint over HTTPS with TLS 1.3 or higher. The `Request-Id` and `UCP-Agent` headers are not validated by this API or its gateway.
2. Request must include a valid OAuth JWT bearer token; unauthenticated or invalid-token requests are rejected with `401 Unauthorized`. Token validation sits on each brand's Flex Gateway.
3. For an existing order, return HTTP `200` with `Content-Type: application/json`. Include required fields: `ucp`, `id`, `checkout_id`, `permalink_url`, `line_items`, `fulfillment`, `currency`, and `totals`. Return the stored snapshot's fields as they are. Currency must match the originating checkout.
4. Return the order snapshot as stored in `ucp_order_latest_status`, without changing it. Its completeness and ordering are the responsibility of the order-lifecycle stories.
5. For a missing order, an order of the other brand, or an order whose stored snapshot is empty, return HTTP `200` with `ucp.status: "error"`, a message with code `not_found` and severity `unrecoverable`. Do not return HTTP 404.
6. Downstream Postgres System API failures return `503 Service Unavailable` with a generic error message; the caller receives no internal detail or stack trace.
7. MUnit tests cover successful retrieval, optional-field handling, invalid requests, missing orders, other-brand and empty-snapshot orders, and backend failures. The API contract and examples are published in Anypoint Exchange.
8. The brand is taken from the `brand` header set by the brand's Flex Gateway (`gracobaby` or `yankeecandle`), never from the caller, and the order lookup matches the value the order-lifecycle application stores for that brand.
9. An order that has been completed but whose Order Created event has not yet been processed returns the same `not_found` envelope as a missing order, never a server error.

## Test scenarios

| # | Scenario | Expected result | Verifies | Tested at |
|---|---|---|---|---|
| 1 | Through the brand's gateway with a valid token, call `GET /orders/{id}` for an existing order. | HTTP 200, `Content-Type: application/json`, body with `ucp`, `id`, `checkout_id`, `permalink_url`, `line_items`, `fulfillment`, `currency`, `totals`; `currency` equals the checkout's. | AC 1, 3 | Gateway and API |
| 2 | Connect with TLS 1.2 only, then with TLS 1.3. | TLS 1.2 refused; TLS 1.3 succeeds. | AC 1 | Gateway |
| 3 | Send no token; an expired or invalid token; a token for the other brand. | 401 each time. | AC 2 | Gateway |
| 4 | Request an existing order and compare the response with the stored snapshot. | Response equals the stored snapshot; no fields added, removed or changed. | AC 3, 4 | API |
| 5 | Request an order id that does not exist. | HTTP 200, `ucp.status: "error"`, one message with `type: "error"`, `code: "not_found"`, `severity: "unrecoverable"`, and no order fields. | AC 5 | API |
| 6 | Through the Yankee Candle gateway, request a Graco order id. | HTTP 200, `code: "not_found"`, `severity: "unrecoverable"`. | AC 5, 8 | API |
| 7 | Request an order whose stored snapshot is empty. | The `not_found` envelope; never a 200 "No data found" body. | AC 5 | API |
| 8 | Through the Graco gateway, request a Graco order placed through Google. | The order is found. | AC 8 | Gateway and API |
| 9 | Send a request with a caller-supplied `brand` header that differs from the gateway's brand. | The gateway's brand is the one used. | AC 8 | Gateway |
| 10 | Make the Postgres System API unavailable; separately make it slow. | Unavailable: HTTP 503 with a generic body (no stack trace or internal host names). Slow: response returns within 10 seconds. | AC 6 | API |
| 11 | Complete a checkout and call Get Order immediately, before the Order Created event has been processed. | HTTP 200 with `code: "not_found"`. | AC 9 | API |
| 12 | Run the MUnit suite; open the API in Anypoint Exchange. | Suite covers successful retrieval, optional fields, invalid requests, missing orders, other-brand and empty-snapshot orders, and backend failures. Exchange shows `GET /order/{orderId}` (reached by Google as `GET /orders/{id}`) with request and response examples. | AC 7 | API |

## Expected responses

**Order found**

```json
{
  "ucp": { "version": "2026-04-08", "status": "success" },
  "id": "US09576379916",
  "checkout_id": "chk_123",
  "permalink_url": "https://www.yankeecandle.com/order/US09576379916",
  "line_items": [],
  "fulfillment": {},
  "currency": "USD",
  "totals": []
}
```

**Order not found** (HTTP 200)

```json
{
  "ucp": { "version": "2026-04-08", "status": "error" },
  "messages": [
    { "type": "error", "code": "not_found", "content": "Order not found", "severity": "unrecoverable" }
  ]
}
```

**Postgres System API unavailable** (HTTP 503)

```json
{
  "status": "Failure",
  "status-code": "503",
  "message": "Service temporarily unavailable"
}
```

## Example request

Only the `Authorization` header is needed; the gateway adds the brand.

```bash
curl --location 'https://qagw01a.apis.newellbrands.com/yankeecandle/orders/<order-id>' \
  --header 'Authorization: Bearer <token>'
```

## Notes for testers

- `Request-Id` and `UCP-Agent` are not validated, so requests without them are accepted.

- An order has no stored snapshot until its Order Created event has been processed, so a very new order returns `not_found` for a short time.
- The content of a found order (line items, fulfillment events, adjustments) comes from the order-lifecycle stories (AC-23, AC-24, AC-25, AC-35, AC-38). Scenario 5 checks that this API returns the stored snapshot unchanged, not that the snapshot is complete.
- Stale-snapshot behaviour, such as a late Shipped event arriving after Delivered, is tested in the order-lifecycle stories.
- A missing or malformed order id or brand returns 400 from the API itself.
