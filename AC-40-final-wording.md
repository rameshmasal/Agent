# AC 40: Final wording for Jira

Story: Google UCP | Order Lifecycle API | Get Order Mulesoft Endpoint

Paste each block into the matching Jira field. Lines marked **(changed)** differ from the proposal you reviewed. Everything else stands as in the proposal.

---

## Acceptance Criteria

1. **(changed)** Expose `GET /orders/{id}` with a required string order ID. Serve the endpoint over HTTPS with TLS 1.3 or higher. The `Request-Id` and `UCP-Agent` headers are not validated by this API or its gateway. [REST requirements](https://ucp.dev/latest/specification/shopping/order/rest/#http-headers)

2. Request must include a valid OAuth JWT bearer token; unauthenticated or invalid-token requests are rejected with `401 Unauthorized`. Token validation sits on each brand's Flex Gateway (AC-39), which also sets the brand (AC 8); test it through the gateway, not against the API directly.

3. **(changed)** For an existing order, return HTTP `200` with `Content-Type: application/json`. Include required fields: `ucp`, `id`, `checkout_id`, `permalink_url`, `line_items`, `fulfillment`, `currency`, and `totals`. Return the stored snapshot's fields as they are. Currency must match the originating checkout. [Response contract](https://ucp.dev/latest/specification/shopping/order/rest/#output-schema)

4. **(changed)** Return the order snapshot as stored in `ucp_order_latest_status`, without changing it. Its completeness and ordering are the responsibility of the order-lifecycle stories (AC-23, AC-24, AC-25, AC-35, AC-38). [Order data model](https://ucp.dev/latest/specification/shopping/order/)

5. **(changed)** For a missing order, an order of the other brand, or an order whose stored snapshot is empty, return the documented HTTP `200` business-error envelope with `ucp.status: "error"`, a message with code `not_found` and severity `unrecoverable`. Do not return HTTP 404. [Error examples](https://ucp.dev/latest/specification/shopping/order/rest/#example)

6. **(changed)** Downstream Postgres SAPI failures return `503 Service Unavailable` with a generic error message; the caller receives no internal detail or stack trace.

7. **(changed)** MUnit tests cover successful retrieval, optional-field handling, invalid requests, missing orders, other-brand and empty-snapshot orders, and backend failures. Publish the API contract and request/response examples in Anypoint Exchange.

8. **(changed)** The brand is taken from the `brand` header set by the brand's Flex Gateway (`gracobaby` or `yankeecandle`), never from the caller, and the order lookup matches the value the order-lifecycle application stores for that brand.

9. **(changed)** An order that has been completed but whose Order Created event has not yet been processed returns the same `not_found` envelope as a missing order, never a server error.

---

## Test Scenarios

1. Through the brand's gateway with a valid token, call `GET /orders/{id}` for an existing order and confirm HTTP 200, `Content-Type: application/json`, and a body with `ucp`, `id`, `checkout_id`, `permalink_url`, `line_items`, `fulfillment`, `currency` and `totals`, with `currency` equal to the checkout's.

2. **(removed)** Header validation is not part of this story, so the scenario is dropped.

3. Connect to the endpoint with TLS 1.2 only and confirm the connection is refused; connect with TLS 1.3 and confirm it succeeds.

4. Through the gateway, send no token, an expired or invalid token, and a token for the other brand, and confirm 401 each time.

5. **(changed)** Request an order and confirm the response equals the stored snapshot, with no fields added, removed or changed.

6. **(removed)** Moved to the order-lifecycle stories: a late Shipped event after Delivered is the lifecycle app's behaviour, not this API's.

7. Request an order id that does not exist and confirm HTTP 200 with `ucp.status: "error"` and one message `type: "error"`, `code: "not_found"`, `severity: "unrecoverable"`, and no order fields.

8. **(changed)** Through the Yankee Candle gateway, request a Graco order id and confirm HTTP 200 with `code: "not_found"`, `severity: "unrecoverable"`.

9. Request an order whose stored snapshot is empty and confirm the `not_found` envelope, never a 200 "No data found" body.

10. Through the Graco gateway, request a Graco order placed through Google and confirm it is found.

11. Send a request with a caller-supplied `brand` header that differs from the gateway's brand and confirm the gateway's brand is the one used.

12. **(changed)** Make the Postgres System API unavailable and confirm HTTP 503 with a generic body (no stack trace or internal host names). Make it slow and confirm the response returns within 10 seconds.

13. **(changed)** Complete a checkout and call Get Order immediately, before the Order Created event has been processed. Confirm HTTP 200 with `code: "not_found"`.

14. **(changed)** Run the MUnit suite and confirm it covers successful retrieval, optional fields, invalid requests, missing orders, other-brand and empty-snapshot orders, and backend failures; confirm Exchange shows `GET /order/{orderId}` (reached by Google as `GET /orders/{id}`) with UCP request and response examples.

---

## Architectural Solution

Each brand has a Flex Gateway proxy (Graco, Yankee Candle). The proxy validates the OAuth JWT and TLS, rewrites `GET /orders/{id}` to this API's `GET /order/{orderId}`, and sets the `brand` header (`gracobaby` or `yankeecandle`), overwriting any value from the caller. It also supplies the Anypoint client credentials.

The API itself only reads. It looks up the order by id and brand in `ucp_order_latest_status` through the Postgres System API, and returns the stored UCP order entity unchanged. The lifecycle webhooks (AC-23, AC-24, AC-25, AC-35, AC-38) write that table.

---

## Implementation details

- **Found:** HTTP 200 with the stored snapshot.
- **Missing order, other-brand order, empty snapshot, or an order not yet processed:** HTTP 200 with the UCP error envelope, `code: "not_found"`, `severity: "unrecoverable"`.
- **Postgres System API failure or timeout:** HTTP 503 with a generic body. The System API timeout is 10 seconds.
- **Invalid `orderId` or `brand`** (anything other than letters, digits, `-` and `_`, up to 64 characters): HTTP 400.
- **Logging:** Splunk gets only order id, status, brand and site. The snapshot, which holds the shopper's name and address, is never logged.

---

## Open questions

- **Q-40-01 (decided):** an order that has been completed but not yet processed returns `not_found`.
- **Q-40-02 (decided):** an order of the other brand returns `not_found`.
